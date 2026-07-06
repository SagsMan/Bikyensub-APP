import AlertModal from "@/app/components/AlertModal";
import Header from "@/app/components/header";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

const networks = [
  { id: "mtn", label: "MTN", logo: require("@/assets/images/mtn.png") },
  {
    id: "airtel",
    label: "Airtel",
    logo: require("@/assets/images/airtel.png"),
  },
  { id: "glo", label: "Glo", logo: require("@/assets/images/glo.png") },
  {
    id: "etisalat",
    label: "9mobile",
    logo: require("@/assets/images/9mobile.png"),
  },
];

const mapNetworkFromAPI = (apiNetwork: any): string | null => {
  if (typeof apiNetwork === "string") {
    const networkMap: { [key: string]: string } = {
      "mtn nigeria": "mtn",
      "airtel nigeria": "airtel",
      "glo nigeria": "glo",
      "9mobile nigeria": "etisalat",
      "etisalat nigeria": "etisalat",
      "t2 mobile nigeria": "etisalat",
      "9mobile": "etisalat",
      etisalat: "etisalat",
    };
    const key = apiNetwork.toLowerCase().trim();
    return networkMap[key] || null;
  }

  // If it's an object with id property
  if (apiNetwork && typeof apiNetwork === "object" && apiNetwork.id) {
    const idMap: { [key: string]: string } = {
      mtn: "mtn",
      airtel: "airtel",
      glo: "glo",
      "9mobile": "etisalat",
      etisalat: "etisalat",
      "t2 mobile": "etisalat",
    };
    const id = String(apiNetwork.id).toLowerCase().trim();
    return idMap[id] || null;
  }

  return null;
};

const cleanDataPlanName = (name: string): string => {
  if (!name) return "";
  // Removes "N" followed by digits (N100) or digits followed by "Naira" (100 Naira)
  // Also cleans up redundant hyphens and extra spaces
  return name
    .replace(/N\d+(,\d+)*/g, "") // Remove N100, N1,000
    .replace(/\d+(,\d+)*\s*Naira/gi, "") // Remove 100 Naira, 50 Naira
    .replace(/\s*-\s*(?=\s*-)/g, "") // Remove hyphen if followed by another hyphen
    .replace(/\s*-\s*$/, "") // Remove trailing hyphen
    .trim()
    .replace(/\s\s+/g, " "); // Clean double spaces
};

const DataPage = () => {
  const { isDark, colors } = useTheme();
  const [selectedNetwork, setSelectedNetwork] = useState<{
    id: string;
    label: string;
    logo: any;
  } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [typeModal, setTypeModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [detectingNetwork, setDetectingNetwork] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [fingerEnabled, setFingerEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [email, setEmail] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualListing, setManualListing] = useState(false);
  const [dataTypes, setDataTypes] = useState<any[]>([{ name: "DATA BUNDLE" }]);
  const [fetchingTypes, setFetchingTypes] = useState(false);

  const resetForm = () => {
    setSelectedNetwork(null);
    setPlans([]);
    setSelectedType(null);
    setSelectedPlan(null);
    setPhoneNumber("");
    setPin("");
    setConfirmVisible(false);
    setTypeModal(false);
    setPlanModal(false);
    setPinVisible(false);
    setManualListing(false);
  };

  const buildReceiptParams = () => ({
    network: selectedNetwork?.label ?? "",
    service_id: `${selectedNetwork?.id}-data`,
    phoneNumber,
    type: selectedType?.name ?? "",
    plan: cleanDataPlanName(selectedPlan?.name ?? ""),
    variation_code: selectedPlan?.plan_id ?? "",
    amount: selectedPlan?.amount ?? "0",
  });

  const fetchDataTypes = async (networkId: string) => {
    try {
      setFetchingTypes(true);
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) return;

      const response = await fetch(endPoints.getDataTypes, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: userToken,
          serviceID: `${networkId}-data`,
        }),
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.success && data.types) {
          // Prepend "Data Bundle" as it's the standard type
          const formattedTypes = [
            { name: "DATA BUNDLE" },
            ...data.types.map((t: any) => ({
              name: t.name || t,
              id: t.id,
              plan_id: t.plan_id || t.id, // Support different ID aliases
            })),
          ];
          setDataTypes(formattedTypes);
        }
      } catch (e) {
        console.error("Failed to parse JSON response:", text);
      }
    } catch (error) {
      console.error("Fetch data types error:", error);
    } finally {
      setFetchingTypes(false);
    }
  };

  const goToResult = (success: boolean) => {
    const params = buildReceiptParams();
    resetForm();
    router.replace({
      pathname: success
        ? "/dashboard/data/data-success"
        : "/dashboard/data/data-failed",
      params: params,
    });
  };

  const getBalance = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingBalance(true);
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) return;

      const response = await fetch(endPoints.getBalance, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: userToken }),
      });

      const data = await response.json();
      if (data.success) {
        setBalance(Number(data.balance) || 0);
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Fetch balance error:", error);
    } finally {
      setLoadingBalance(false);
      setRefreshing(false);
    }
  };

  const fetchDataPlans = async (networkId: string, typeObj: any) => {
    try {
      setFetchingPlans(true);
      let response;

      if (!typeObj || typeObj.name === "DATA BUNDLE") {
        const url = `${endPoints.getDataPlans}?network=${networkId}-data`;
        response = await fetch(url);
      } else {
        // Fetch from getOtherData.php for dynamic types
        const userToken = await AsyncStorage.getItem("userToken");
        response = await fetch(endPoints.getOtherData, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: userToken,
            plan_id: typeObj.id,
          }),
        });
      }

      const data = await response.json();
      if (data.success && data.plans) {
        setPlans(data.plans);
      } else {
        setAlertTitle("Plans Error");
        setAlertMessage(data.message || "Failed to fetch data plans.");
        setAlertVisible(true);
      }
    } catch (error) {
      console.error("Fetch plans error:", error);
      setAlertTitle("Error");
      setAlertMessage("Unable to fetch data plans.");
      setAlertVisible(true);
    } finally {
      setFetchingPlans(false);
    }
  };

  useEffect(() => {
    getBalance();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getBalance(true);
      const loadFinger = async () => {
        try {
          const storedFinger = await AsyncStorage.getItem("finger");
          setFingerEnabled(storedFinger === "1");
        } catch (error) {
          setFingerEnabled(false);
        }
      };
      loadFinger();
    }, []),
  );

  // Detect Network Function
  const detectNetwork = async (phone: string) => {
    try {
      const res = await fetch(endPoints.detectNetwork, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      console.log("Detect Network Response:", data);

      if (data.network || data.raw) {
        const networkId = mapNetworkFromAPI(data.network || data.raw);

        if (networkId) {
          const detected = networks.find((net) => net.id === networkId);

          if (detected) {
            setSelectedNetwork(detected);
            setManualListing(false);
            fetchDataTypes(detected.id);
          } else {
            setManualListing(true);
            setAlertTitle("Detection Failed");
            setAlertMessage("Unable to find network. Please select manually.");
            setAlertVisible(true);
          }
        } else {
          setManualListing(true);
          setAlertTitle("Detection Failed");
          setAlertMessage(
            "Network format not recognized. Please select manually.",
          );
          setAlertVisible(true);
        }
      } else {
        setManualListing(true);
        setAlertTitle("Detection Failed");
        setAlertMessage(data.message || "Unable to detect network.");
        setAlertVisible(true);
      }
    } catch (err) {
      console.log("Detection Error:", err);
      setManualListing(true);
      setAlertTitle("Error");
      setAlertMessage("Network detection failed. Please select manually.");
      setAlertVisible(true);
    } finally {
      setDetectingNetwork(false);
    }
  };

  // Handle Phone Number Change
  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    // Reset selections on phone number change
    setSelectedType(null);
    setSelectedPlan(null);
    setPlans([]);

    if (text.length === 11 && /^\d+$/.test(text)) {
      Keyboard.dismiss();
      setDetectingNetwork(true);
      detectNetwork(text);
    } else if (text.length !== 11) {
      setSelectedNetwork(null);
      setManualListing(false);
    }
  };

  const handleFingerprintPay = async () => {
    if (!fingerEnabled) {
      setAlertTitle("Fingerprint Disabled");
      setAlertMessage("Enable fingerprint in settings to use this option.");
      setAlertVisible(true);
      return;
    }

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setAlertTitle("Not Supported");
        setAlertMessage("Device does not support fingerprint.");
        setAlertVisible(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Pay with Fingerprint",
      });

      if (!result.success) {
        setAlertTitle("Fingerprint Failed");
        setAlertMessage("Authentication failed. Please try again.");
        setAlertVisible(true);
        return;
      }

      setProcessing(true);
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        setAlertTitle("Error");
        setAlertMessage("User not authenticated");
        setAlertVisible(true);
        setProcessing(false);
        return;
      }

      const isStandardBundle = selectedType?.name === "DATA BUNDLE";
      const url = isStandardBundle ? endPoints.buyData : endPoints.buyOtherData;

      const payload = isStandardBundle
        ? {
            token: userToken,
            amount: selectedPlan!.amount,
            number: phoneNumber,
            serviceID: `${selectedNetwork!.id}-data`,
            variation: selectedPlan!.plan_id,
            pin: pin || "fingerprint",
          }
        : {
            token: userToken,
            number: phoneNumber,
            plan_id: selectedPlan!.id,
            pin: pin || "fingerprint",
          };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setPinVisible(false);
        goToResult(true);
        getBalance(true);
      } else {
        setAlertTitle("Failed");
        setAlertMessage(data.message || "Transaction failed");
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage("Unable to complete transaction.");
      setAlertVisible(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleDataPurchase = async () => {
    try {
      setProcessing(true);
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        setAlertTitle("Error");
        setAlertMessage("User not authenticated");
        setAlertVisible(true);
        setProcessing(false);
        return;
      }

      const isStandardBundle = selectedType?.name === "DATA BUNDLE";
      const url = isStandardBundle ? endPoints.buyData : endPoints.buyOtherData;

      const payload = isStandardBundle
        ? {
            token: userToken,
            amount: selectedPlan!.amount,
            number: phoneNumber,
            serviceID: `${selectedNetwork!.id}-data`,
            variation: selectedPlan!.plan_id,
            pin: pin,
          }
        : {
            token: userToken,
            number: phoneNumber,
            plan_id: selectedPlan!.id,
            pin: pin,
          };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setPinVisible(false);
        goToResult(true);
        getBalance(true);
      } else {
        setPin("");
        setAlertTitle("Failed");
        setAlertMessage(data.message || "Transaction failed");
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage("Something went wrong");
      setAlertVisible(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { marginTop: -30, backgroundColor: colors.background },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Buy Data" />
          <View style={styles.content}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Customer Phone Number
            </Text>
            <View
              style={[
                styles.phoneInputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <TextInput
                placeholder=""
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.text }]}
                maxLength={11}
              />
              {detectingNetwork ? (
                <ActivityIndicator
                  size="small"
                  color={colors.accent}
                  style={styles.loadingIndicator}
                />
              ) : phoneNumber.length > 0 ? (
                <TouchableOpacity
                  onPress={resetForm}
                  style={styles.loadingIndicator}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {(selectedNetwork || manualListing) && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {selectedNetwork ? "Detected Network" : "Select Network"}
                </Text>
                <View style={styles.networkRow}>
                  {selectedNetwork ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.networkCard,
                        styles.networkCardActive,
                        { borderColor: colors.primary },
                      ]}
                    >
                      <Image
                        source={selectedNetwork.logo}
                        style={styles.networkLogo}
                      />
                    </TouchableOpacity>
                  ) : (
                    networks.map((net) => (
                      <TouchableOpacity
                        key={net.id}
                        activeOpacity={0.8}
                        style={[
                          styles.networkCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => {
                          setSelectedNetwork(net);
                          setManualListing(false);
                          fetchDataTypes(net.id);
                        }}
                      >
                        <Image source={net.logo} style={styles.networkLogo} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Type
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  onPress={() => setTypeModal(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.selectText,
                      { color: colors.text },
                      !selectedType && [
                        styles.selectPlaceholder,
                        { color: colors.textMuted },
                      ],
                    ]}
                  >
                    {selectedType?.name ?? "Choose a type"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={colors.accent}
                  />
                </TouchableOpacity>

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Data Bundle
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                  onPress={() => setPlanModal(true)}
                  activeOpacity={0.8}
                  disabled={fetchingPlans}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        { color: colors.text },
                        !selectedPlan && [
                          styles.selectPlaceholder,
                          { color: colors.textMuted },
                        ],
                      ]}
                    >
                      {fetchingPlans
                        ? "Fetching plans..."
                        : (selectedPlan?.name ?? "Choose a bundle")}
                    </Text>
                  </View>
                  {fetchingPlans ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              </>
            )}

            {selectedNetwork && selectedType && selectedPlan && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.continueButton}
                onPress={() => {
                  const cleanedPhone = phoneNumber.trim();
                  const isValidPhone =
                    cleanedPhone.startsWith("0") &&
                    cleanedPhone.length === 11 &&
                    /^\d+$/.test(cleanedPhone);

                  if (!isValidPhone) {
                    setAlertTitle("Invalid Phone Number");
                    setAlertMessage(
                      "Phone number must start with 0 and be 11 digits.",
                    );
                    setAlertVisible(true);
                    return;
                  }

                  setConfirmVisible(true);
                }}
              >
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        isVisible={typeModal}
        onBackdropPress={() => setTypeModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Select Type
          </Text>
          {dataTypes.map((type) => (
            <TouchableOpacity
              key={type.name}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSelectedType(type);
                setSelectedPlan(null);
                setTypeModal(false);
                if (selectedNetwork) {
                  fetchDataPlans(selectedNetwork.id, type);
                } else {
                  setAlertTitle("Network Missing");
                  setAlertMessage("Please enter a phone number first.");
                  setAlertVisible(true);
                }
              }}
            >
              <Text style={[styles.modalItemText, { color: colors.text }]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <Modal
        isVisible={planModal}
        onBackdropPress={() => setPlanModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Select Data Bundle
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {plans.map((plan, index) => (
              <TouchableOpacity
                key={plan.id || plan.plan_id || `plan-${index}`}
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedPlan(plan);
                  setPlanModal(false);
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingRight: 10,
                    gap: 12,
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { flex: 1, color: colors.text },
                    ]}
                  >
                    {cleanDataPlanName(plan.name)}
                  </Text>
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        fontWeight: "700",
                        color: colors.accent,
                        flexShrink: 0,
                      },
                    ]}
                  >
                    ₦{Number(plan.amount).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        isVisible={confirmVisible}
        onBackdropPress={() => setConfirmVisible(false)}
        style={styles.confirmModal}
      >
        <View style={[styles.confirmCard, { backgroundColor: colors.surface }]}>
          <ScrollView
            contentContainerStyle={styles.confirmScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.confirmHeader}>
              <View>
                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  Confirm and Pay
                </Text>
                <Text
                  style={[styles.confirmSubtitle, { color: colors.textMuted }]}
                >
                  if transaction was successfully, no refund!
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.confirmBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Network:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedNetwork?.label ?? "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Type:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedType?.name ?? "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Plan:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedPlan?.name ?? "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Phone Number:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {phoneNumber || "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Amount:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  ₦{Number(selectedPlan?.amount || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.balanceCard,
                {
                  backgroundColor: isDark ? colors.surface : "#f8fafc",
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>
                Wallet Balance
              </Text>
              <View style={styles.balanceRow}>
                <Text
                  style={[styles.balanceSmall, { color: colors.textMuted }]}
                >
                  Balance
                </Text>
                <Text style={[styles.balanceValue, { color: colors.primary }]}>
                  ₦{balance.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: isDark ? colors.surface : "#f1f5f9",
                    borderColor: colors.secondary,
                  },
                ]}
                onPress={() => setConfirmVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={[styles.cancelText, { color: colors.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.payButton}
                activeOpacity={0.85}
                onPress={() => {
                  const amount = Number(selectedPlan?.amount || 0);
                  if (amount > balance) {
                    setAlertTitle("Insufficient Balance");
                    setAlertMessage(
                      "You have insufficient funds to complete this transaction.",
                    );
                    setAlertVisible(true);
                  } else {
                    setConfirmVisible(false);
                    setPinVisible(true);
                  }
                }}
              >
                <LinearGradient
                  colors={colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payGradient}
                >
                  <Text style={styles.payText}>Pay</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        isVisible={pinVisible}
        onBackdropPress={() => setPinVisible(false)}
        style={styles.pinModal}
      >
        <View
          style={[styles.pinScreen, { backgroundColor: colors.background }]}
        >
          <TouchableOpacity
            onPress={() => setPinVisible(false)}
            style={styles.pinBack}
          >
            <Text style={[styles.pinBackText, { color: colors.primary }]}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.pinContent}>
            <Text style={[styles.pinTitle, { color: colors.text }]}>
              Enter Passcode
            </Text>

            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={`dot-${idx}`}
                  style={[
                    styles.pinDot,
                    { backgroundColor: colors.border },
                    pin.length > idx && [
                      styles.pinDotActive,
                      { backgroundColor: colors.primary },
                    ],
                  ]}
                />
              ))}
            </View>
            {processing && (
              <ActivityIndicator size="large" color={colors.primary} />
            )}
          </View>

          <View style={styles.pinBottom}>
            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={`key-${num}`}
                  style={[
                    styles.keyButton,
                    { backgroundColor: isDark ? colors.surface : "#f8fafc" },
                  ]}
                  onPress={() => {
                    setPin((prev) =>
                      prev.length < 4 ? `${prev}${num}` : prev,
                    );
                  }}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.keyButton,
                  styles.keyButtonGhost,
                  { backgroundColor: isDark ? colors.border : "#f6f8ff" },
                ]}
                onPress={() => setPin((prev) => prev.slice(0, -1))}
              >
                <Ionicons
                  name="backspace-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.keyButton,
                  { backgroundColor: isDark ? colors.surface : "#f8fafc" },
                ]}
                onPress={() => {
                  setPin((prev) => (prev.length < 4 ? `${prev}0` : prev));
                }}
              >
                <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.keyButton,
                  styles.keyButtonGhost,
                  { backgroundColor: isDark ? colors.border : "#f6f8ff" },
                ]}
                onPress={() => {
                  if (pin.length < 4) {
                    setAlertTitle("Incomplete PIN");
                    setAlertMessage("Please enter your 4-digit PIN.");
                    setAlertVisible(true);
                    return;
                  }
                  handleDataPurchase();
                }}
              >
                <Ionicons
                  name="return-up-forward-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {fingerEnabled && (
              <TouchableOpacity
                style={styles.fingerprintWrap}
                onPress={handleFingerprintPay}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.fingerprintText, { color: colors.textMuted }]}
                >
                  Pay with finger print
                </Text>
                <Image
                  source={require("@/assets/images/fingerprint.png")}
                  style={styles.fingerprintIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      <AlertModal
        isVisible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLink: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1f36",
    marginBottom: 12,
  },
  networkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  networkCard: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e6ecff",
  },
  networkCardActive: {
    borderColor: "#2b6cb0",
    borderWidth: 2,
  },
  networkLogo: {
    width: 55,
    height: 55,
  },
  inputLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 6,
  },
  selectInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7dcf4",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  selectText: {
    fontSize: 14,
    color: "#1a1f36",
  },
  selectPlaceholder: {
    color: "#9aa3b2",
  },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7dcf4",
    paddingHorizontal: 14,
  },
  loadingIndicator: {
    position: "absolute",
    right: 14,
  },
  continueButton: {
    marginTop: 10,
  },
  continueGradient: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  modal: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1f36",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef1ff",
  },
  modalLogo: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  modalItemText: {
    fontSize: 14,
    color: "#1a1f36",
  },
  confirmModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  confirmCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "80%",
  },
  confirmScroll: {
    paddingBottom: 8,
  },
  balanceCard: {
    borderWidth: 1,
    borderColor: "#dce4ff",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    backgroundColor: "#f8fbff",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#1a1f36",
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  balanceSmall: {
    fontSize: 11,
    color: "#6b7280",
  },
  balanceValue: {
    fontSize: 18,
    color: "#1a1f36",
    fontWeight: "700",
  },
  confirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1f36",
  },
  confirmSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  confirmBox: {
    borderWidth: 1,
    borderColor: "#dce4ff",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  confirmLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  confirmValue: {
    fontSize: 12,
    color: "#1a1f36",
    fontWeight: "600",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "600",
  },
  payButton: {
    flex: 1,
  },
  payGradient: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  payText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  pinModal: {
    margin: 0,
  },
  pinScreen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  pinBack: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  pinBackText: {
    color: "#2b2e80",
    fontSize: 14,
    fontWeight: "600",
  },
  pinContent: {
    alignItems: "center",
    marginTop: 30,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a2b6d",
    marginTop: 8,
  },
  pinDots: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    marginBottom: 18,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e0e6f2",
  },
  pinDotActive: {
    backgroundColor: "#2b6cb0",
  },
  keypad: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  pinBottom: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    paddingBottom: 30,
  },
  keyButton: {
    width: "30%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6ecff",
    alignItems: "center",
    justifyContent: "center",
  },
  keyButtonGhost: {
    borderColor: "transparent",
    backgroundColor: "#f6f8ff",
  },
  keyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1f36",
  },
  fingerprintWrap: {
    alignItems: "center",
    marginTop: 22,
  },
  fingerprintText: {
    fontSize: 12,
    color: "#2b2e80",
    marginBottom: 10,
  },
  fingerprintIcon: {
    width: 60,
    height: 60,
  },
});

export default DataPage;
