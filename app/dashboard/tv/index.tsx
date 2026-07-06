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

const providers = [
  { id: "gotv", label: "GOTV", logo: require("@/assets/images/gotv.png") },
  { id: "dstv", label: "DSTV", logo: require("@/assets/images/dstv.png") },
  {
    id: "startimes",
    label: "Startimes",
    logo: require("@/assets/images/star.png"),
  },
  {
    id: "showmax",
    label: "Showmax",
    logo: require("@/assets/images/showmax.png"),
  },
];

const cleanTvPlanName = (name: string): string => {
  if (!name) return "";
  // Removes "N" followed by digits (N100) or digits followed by "Naira" (100 Naira)
  // Also cleans up redundant hyphens and extra spaces
  return name
    .replace(/\s*-\s*N\d+(,\d+)*\s*/gi, " - ") // Remove " - N8,400 "
    .replace(/\s*N\d+(,\d+)*\s*/gi, " ") // Remove " N8,400 "
    .replace(/\s*-\s*\d+(,\d+)*\s*Naira/gi, " - ") // Remove " - 100 Naira"
    .replace(/\d+(,\d+)*\s*Naira/gi, " ") // Remove "100 Naira"
    .replace(/\s*-\s*-\s*/g, " - ") // Remove redundant hyphens
    .replace(/\s*-\s*$/g, "") // Remove trailing hyphen
    .trim()
    .replace(/\s\s+/g, " "); // Clean double spaces
};

const TvSubscription = () => {
  const { isDark, colors } = useTheme();
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string;
    label: string;
    logo: number;
  } | null>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);
  const [providerModal, setProviderModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [smartcardNumber, setSmartcardNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [fingerEnabled, setFingerEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [fetchingVariations, setFetchingVariations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetForm = () => {
    setSelectedProvider(null);
    setVariations([]);
    setSelectedVariation(null);
    setSmartcardNumber("");
    setPhoneNumber("");
    setEmail("");
    setPin("");
    setCustomerName("");
    setIsVerified(false);
    setIsVerifying(false);
    setConfirmVisible(false);
    setProviderModal(false);
    setPlanModal(false);
    setPinVisible(false);
    setLoading(false);
  };

  const buildReceiptParams = () => ({
    provider: selectedProvider?.label ?? "",
    plan: cleanTvPlanName(selectedVariation?.name) ?? "",
    variation: selectedVariation?.variation_code ?? "",
    smartcardNumber,
    phoneNumber,
    amount: selectedVariation?.variation_amount ?? "0",
  });

  const fetchVariations = async (serviceID: string) => {
    try {
      setFetchingVariations(true);
      const response = await fetch(
        endPoints.getTVPlans,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceID }),
        },
      );
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON parse error. Response was:", responseText);
        throw new Error("Invalid server response format");
      }

      if (data.response_description === "000") {
        const foundVariations = data.content?.variations || [];
        setVariations(foundVariations);
        if (foundVariations.length > 0) {
          setPlanModal(true);
        }
      } else {
        setAlertTitle("Error");
        setAlertMessage(data.message || "Failed to fetch variations");
        setAlertVisible(true);
      }
    } catch (err: any) {
      console.error("Fetch variations error:", err);
      // Optional: Show error to user
    } finally {
      setFetchingVariations(false);
    }
  };

  const verifySmartCard = async (smartcard: string, serviceID: string) => {
    if (!smartcard || !serviceID) return;
    try {
      setIsVerifying(true);
      setErrorMessage("");
      setErrorVisible(false);

      const response = await fetch(
        endPoints.verifySmartCard,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ smartcard, serviceID }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setCustomerName(data.data.customer_name);
        setIsVerified(true);
      } else {
        setCustomerName("");
        setIsVerified(false);
        setErrorMessage(data.message || "Invalid smartcard");
        setErrorVisible(true);
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (smartcardNumber.length >= 10 && selectedProvider) {
      const delayDebounceFn = setTimeout(() => {
        verifySmartCard(smartcardNumber, selectedProvider.id);
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsVerified(false);
      setCustomerName("");
      setErrorMessage("");
      setErrorVisible(false);
    }
  }, [smartcardNumber, selectedProvider]);

  const goToResult = (success: boolean) => {
    const params = buildReceiptParams();
    resetForm();
    router.replace({
      pathname: success ? "/dashboard/tv/tv-success" : "/dashboard/tv/tv-failed",
      params: params,
    });
  };
  const fetchBalance = async () => {
    try {
      setLoadingBalance(true);
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) return;

      const response = await fetch(
        endPoints.getBalance,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: userToken }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setBalance(Number(data.balance));
      }
    } catch (error) {
      console.error("Fetch balance error:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadFinger = async () => {
    try {
      const storedFinger = await AsyncStorage.getItem("finger");
      setFingerEnabled(storedFinger === "1");
    } catch (error) {
      setFingerEnabled(false);
    }
  };

  useEffect(() => {
    loadFinger();
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetForm();
      fetchBalance();
      loadFinger();
      return undefined;
    }, []),
  );

  const handleTvPurchase = async (finalPin: string) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        setAlertTitle("Session Expired");
        setAlertMessage("Please login again.");
        setAlertVisible(true);
        return;
      }

      const response = await fetch(endPoints.tvSub, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: userToken,
          smartcard: smartcardNumber,
          serviceID: selectedProvider?.id,
          variation: selectedVariation?.variation_code,
          amount: selectedVariation?.variation_amount,
          pin: finalPin,
          phone: phoneNumber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPinVisible(false);
        setBalance(data.balance);
        goToResult(true);
      } else {
        setAlertTitle("Purchase Failed");
        setAlertMessage(data.message || "Something went wrong.");
        setAlertVisible(true);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setAlertTitle("Error");
      setAlertMessage("Unable to complete transaction.");
      setAlertVisible(true);
    } finally {
      setLoading(false);
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

      if (result.success) {
        await handleTvPurchase("fingerprint");
      }
    } catch (error) {
      console.error("Fingerprint auth error:", error);
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
      <Header title="TV Subscription" />

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Provider
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.networkRow}
            >
              {providers.map((item) => {
                const isActive = selectedProvider?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setSelectedProvider(item);
                      setSelectedVariation(null);
                      setSmartcardNumber("");
                      setIsVerified(false);
                      setCustomerName("");
                      setErrorVisible(false);
                      setErrorMessage("");
                      fetchVariations(item.id);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.networkCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      isActive && [
                        styles.networkCardActive,
                        { borderColor: colors.primary },
                      ],
                    ]}
                  >
                    <Image
                      source={item.logo}
                      style={styles.networkLogo}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Or Select Here
            </Text>
            <TouchableOpacity
              style={[
                styles.selectInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                },
              ]}
              onPress={() => setProviderModal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectText,
                  { color: colors.text },
                  !selectedProvider && [
                    styles.selectPlaceholder,
                    { color: colors.textMuted },
                  ],
                ]}
              >
                {selectedProvider?.label ?? "Choose a provider"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.accent} />
            </TouchableOpacity>

            {selectedProvider && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Select Bouquet
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
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectText,
                        { color: colors.text },
                        !selectedVariation && [
                          styles.selectPlaceholder,
                          { color: colors.textMuted },
                        ],
                      ]}
                    >
                      {selectedVariation
                        ? cleanTvPlanName(selectedVariation.name)
                        : "Choose a bouquet"}
                    </Text>
                    {selectedVariation && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.primary,
                          fontWeight: "700",
                        }}
                      >
                        ₦
                        {Number(
                          selectedVariation.variation_amount,
                        ).toLocaleString()}
                      </Text>
                    )}
                  </View>
                  {fetchingVariations ? (
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

            {selectedVariation && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Smartcard Number (CCA IUC)
                </Text>
                <View
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingRight: 10,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="Enter Smartcard Number"
                    keyboardType="numeric"
                    value={smartcardNumber}
                    onChangeText={(text) => {
                      setSmartcardNumber(text);
                      setIsVerified(false);
                      setCustomerName("");
                    }}
                    placeholderTextColor={colors.textMuted}
                    style={[{ color: colors.text, flex: 1, height: "100%" }]}
                  />
                  {isVerifying && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                  {isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#22c55e"
                    />
                  )}
                </View>

                {isVerified && customerName && (
                  <Text
                    style={{
                      color: "#22c55e",
                      fontSize: 13,
                      fontWeight: "600",
                      marginBottom: 15,
                      marginTop: -10,
                    }}
                  >
                    ✔ Customer Name: {customerName}
                  </Text>
                )}

                {errorVisible && errorMessage && (
                  <Text
                    style={{
                      color: "#ef4444",
                      fontSize: 13,
                      fontWeight: "600",
                      marginBottom: 15,
                      marginTop: -10,
                    }}
                  >
                    ❌ {errorMessage}
                  </Text>
                )}
              </>
            )}

            {isVerified && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Phone Number
                </Text>
                <TextInput
                  placeholder="Recipient Phone Number"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  maxLength={11}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.continueButton, loading && { opacity: 0.6 }]}
                  disabled={loading}
                  onPress={() => {
                    if (!selectedVariation) {
                      setAlertTitle("Select Bouquet");
                      setAlertMessage("Please choose a subscription plan.");
                      setAlertVisible(true);
                      return;
                    }
                    const cleanedPhone = phoneNumber.trim();
                    if (cleanedPhone.length !== 11) {
                      setAlertTitle("Invalid Phone");
                      setAlertMessage("Phone number must be 11 digits.");
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
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        isVisible={providerModal}
        onBackdropPress={() => setProviderModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Select Provider
          </Text>
          {providers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSelectedProvider(item);
                setSelectedVariation(null);
                setSmartcardNumber("");
                setIsVerified(false);
                setCustomerName("");
                setErrorVisible(false);
                setErrorMessage("");
                setProviderModal(false);
                fetchVariations(item.id);
              }}
            >
              <Image
                source={item.logo}
                style={styles.modalLogo}
                resizeMode="contain"
              />
              <Text style={[styles.modalItemText, { color: colors.text }]}>
                {item.label}
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
            Select Bouquet
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {variations.map((v, index) => (
              <TouchableOpacity
                key={v.variation_code || `plan-${index}`}
                style={[styles.modalItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedVariation(v);
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
                    {cleanTvPlanName(v.name)}
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
                    ₦{Number(v.variation_amount).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {variations.length === 0 && !fetchingVariations && (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.textMuted,
                  paddingVertical: 20,
                }}
              >
                No plans found.
              </Text>
            )}
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
                  Provider:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedProvider?.label ?? "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Bouquet:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {cleanTvPlanName(selectedVariation?.name) || "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Smartcard:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {smartcardNumber || "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Amount:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  ₦
                  {Number(
                    selectedVariation?.variation_amount || 0,
                  ).toLocaleString()}
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
            </View>

            <View
              style={[
                styles.balanceCard,
                {
                  backgroundColor: isDark ? colors.surface : "#f8fbff",
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
                  Available Balance
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
                  setConfirmVisible(false);
                  setPinVisible(true);
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
            {loading && (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
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
                  handleTvPurchase(pin);
                }}
              >
                <Ionicons name="return-up-forward-outline" size={20} />
              </TouchableOpacity>
            </View>
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
    gap: 12,
    paddingRight: 12,
    marginBottom: 16,
  },
  networkCard: {
    width: 120,
    height: 50,
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
    width: 105,
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
  textInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7dcf4",
    paddingHorizontal: 14,
    marginBottom: 16,
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
    width: 55,
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

export default TvSubscription;
