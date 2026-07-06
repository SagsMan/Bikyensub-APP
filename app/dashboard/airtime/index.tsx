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

// Map network from API response
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

const Airtime = () => {
  const { isDark, colors } = useTheme();
  const [selectedNetwork, setSelectedNetwork] = useState<{
    id: string;
    label: string;
    logo: any;
  } | null>(null);

  const [processing, setProcessing] = useState(false);
  const [detectingNetwork, setDetectingNetwork] = useState(false);
  const [manualListing, setManualListing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [fingerEnabled, setFingerEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const discountRate = 0.01;
  const amountValue = Number(amount) || 0;
  const amountToPay = Math.max(amountValue - amountValue * discountRate, 0);

  const resetForm = () => {
    setSelectedNetwork(null);
    setPhoneNumber("");
    setAmount("");
    setPin("");
    setConfirmVisible(false);
    setModalVisible(false);
    setPinVisible(false);
    setManualListing(false);
  };

  const buildReceiptParams = () => ({
    network: selectedNetwork?.label ?? "",
    phoneNumber,
    amount: amountValue.toString(),
    discount: (discountRate * 100).toString(),
    amountToPay: amountToPay.toString(),
  });

  const goToResult = (success: boolean) => {
    const params = buildReceiptParams();
    resetForm();
    router.replace({
      pathname: success
        ? "/dashboard/airtime/airtime-success"
        : "/dashboard/airtime/airtime-failed",
      params: params,
    });
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
      const loadFinger = async () => {
        try {
          const storedFinger = await AsyncStorage.getItem("finger");
          setFingerEnabled(storedFinger === "1");
        } catch (error) {
          setFingerEnabled(false);
        }
      };
      loadFinger();
      return undefined;
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
        // Map API response network to our network id
        const networkId = mapNetworkFromAPI(data.network || data.raw);
        console.log("Mapped Network ID:", networkId);

        if (networkId) {
          const detected = networks.find((net) => net.id === networkId);
          console.log("Detected Network:", detected);

          if (detected) {
            setSelectedNetwork(detected);
            setManualListing(false);
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
    // Only allow digits and limit to 11 characters
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 11);
    setPhoneNumber(cleaned);

    if (cleaned.length === 11) {
      Keyboard.dismiss();
      setDetectingNetwork(true);
      detectNetwork(cleaned);
    } else if (cleaned.length !== 11) {
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

      if (!selectedNetwork || !phoneNumber || !amount) {
        setAlertTitle("Missing Fields");
        setAlertMessage("Please fill all fields");
        setAlertVisible(true);
        setProcessing(false);
        return;
      }

      const response = await fetch(endPoints.buyAirtime, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: userToken,
          amount: Number(amount),
          number: phoneNumber,
          network: selectedNetwork!.id,
          pin: pin || "fingerprint",
        }),
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

  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const getBalance = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        console.log("No token found");
        return;
      }

      const response = await fetch(endPoints.buyAirtime, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: userToken }),
      });

      const data = await response.json();

      if (data.success) {
        setBalance(Number(data.balance) || 0);
        setEmail(data.email || "");
      } else {
        console.log("API Error:", data.message);
      }
    } catch (error) {
      console.error("Fetch balance error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getBalance();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getBalance(true);
    }, []),
  );

  const handleAirtimePurchase = async () => {
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

      const response = await fetch(endPoints.buyAirtime, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: userToken,
          amount: Number(amount),
          number: phoneNumber,
          network: selectedNetwork!.id,
          pin: pin,
        }),
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
          <Header title="Buy Airtime" />

          <View style={styles.content}>
            {/* Phone Number input first */}
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

            {/* Show Network selection only after detection */}
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
                        }}
                      >
                        <Image source={net.logo} style={styles.networkLogo} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}

            {/* Amount input only after network is detected */}
            {selectedNetwork && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Amount
                </Text>
                <TextInput
                  placeholder=""
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                />
              </>
            )}

            {/* Continue button only after amount is entered */}
            {selectedNetwork && amount && (
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

                  const amountValue = Number(amount) || 0;
                  if (amountValue < 50) {
                    setAlertTitle("Invalid Amount");
                    setAlertMessage("Amount must be at least 50.");
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
                <Text style={[styles.confirmLabel, { color: colors.text }]}>
                  Network:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedNetwork?.label ?? "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.text }]}>
                  Phone Number:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {phoneNumber || "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.text }]}>
                  Amount
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {amountValue ? `₦${amountValue.toLocaleString()}` : "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.text }]}>
                  Discount
                </Text>
                <Text style={[styles.confirmValue, { color: colors.success }]}>
                  1%
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.text }]}>
                  Amount to Pay
                </Text>
                <Text
                  style={[
                    styles.confirmValue,
                    { color: colors.primary, fontWeight: "700" },
                  ]}
                >
                  {amountValue ? `N${amountToPay.toLocaleString()}` : "-"}
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
                  setConfirmVisible(false);
                  if (amountToPay > balance) {
                    setAlertTitle("Insufficient Balance");
                    setAlertMessage(
                      "You have insufficient funds to complete this transaction.",
                    );
                    setAlertVisible(true);
                  } else {
                    setPinVisible(true);
                  }
                }}
              >
                {amountToPay > balance && (
                  <Text style={styles.payText}>Insufficient Balance</Text>
                )}
                <LinearGradient
                  colors={isDark ? colors.gradient : ["#2A98CF", "#281D74"]}
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
                  handleAirtimePurchase();
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
  pinTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a2b6d",
    marginTop: 8,
  },
  pinContent: {
    alignItems: "center",
    marginTop: 100,
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

export default Airtime;
