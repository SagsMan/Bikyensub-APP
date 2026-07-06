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


const distributors = [
  { id: "jos-electric", label: "Jos Electric (JED)", logo: require("@/assets/images/jed.png") },
  { id: "ikeja-electric", label: "Ikeja Electric (IKEDC)", logo: require("@/assets/images/ikeja.png") },
  { id: "kano-electric", label: "Kano Electric (KEDCO)", logo: require("@/assets/images/kedco.png") },
  { id: "abuja-electric", label: "Abuja Electric (AEDC)", logo: require("@/assets/images/abuja.png") },
  { id: "eko-electric", label: "Eko Electric (EKEDC)", logo: require("@/assets/images/elec.png") },
  { id: "portharcourt-electric", label: "Port Harcourt (PHED)", logo: require("@/assets/images/elec.png") },
  { id: "ibadan-electric", label: "Ibadan Electric (IBEDC)", logo: require("@/assets/images/elec.png") },
  { id: "kaduna-electric", label: "Kaduna Electric (KAEDCO)", logo: require("@/assets/images/elec.png") },
  { id: "enugu-electric", label: "Enugu Electric (EEDC)", logo: require("@/assets/images/elec.png") },
  { id: "benin-electric", label: "Benin Electric (BEDC)", logo: require("@/assets/images/elec.png") },
  { id: "aba-electric", label: "Aba Electric (ABA)", logo: require("@/assets/images/elec.png") },
];

const meterTypes = ["Prepaid", "Postpaid"];

const Electricity = () => {
  const { isDark, colors } = useTheme();
  const [selectedDistributor, setSelectedDistributor] = useState<{
    id: string;
    label: string;
    logo: number;
  } | null>(null);
  const [selectedMeterType, setSelectedMeterType] = useState<string | null>(null);
  const [distributorModal, setDistributorModal] = useState(false);
  const [meterModal, setMeterModal] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [customerAddress, setCustomerAddress] = useState("");

  const resetForm = () => {
    setSelectedDistributor(null);
    setSelectedMeterType(null);
    setMeterNumber("");
    setAmount("");
    setPhoneNumber("");
    setPin("");
    setCustomerName("");
    setIsVerified(false);
    setIsVerifying(false);
    setConfirmVisible(false);
    setDistributorModal(false);
    setMeterModal(false);
    setPinVisible(false);
    setLoading(false);
    setErrorMessage("");
    setErrorVisible(false);
  };

  const buildReceiptParams = (token?: string) => ({
    distributor: selectedDistributor?.label ?? "",
    meterType: selectedMeterType ?? "",
    meterNumber,
    amount,
    phoneNumber,
    token: token ?? "",
  });

  const fetchBalance = async () => {
    try {
      setLoadingBalance(true);
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) return;

      const response = await fetch(endPoints.getBalance, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: userToken }),
      });

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

  const validateMeter = async (meter: string, serviceID: string, type: string) => {
    if (!meter || !serviceID || !type) return;

    try {
      setIsVerifying(true);
      setErrorMessage("");
      setErrorVisible(false);

      const response = await fetch(endPoints.validateMeter, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter,
          serviceID,
          type: type.toLowerCase()
        }),
      });

      const data = await response.json();

      const isValid =
        data.code === "000" &&
        data.content &&
        !data.content.WrongBillersCode &&
        data.content.Customer_Name;

      if (isValid) {
        // ✅ SAVE NAME + ADDRESS
        setCustomerName(data.content.Customer_Name?.trim());
        setCustomerAddress(data.content.Address?.trim() || "");
        setIsVerified(true);
      } else {
        setCustomerName("");
        setCustomerAddress("");
        setIsVerified(false);

        const errorMsg =
          data.content?.error ||
          data.message ||
          "Invalid meter number";

        setErrorMessage(errorMsg);
        setErrorVisible(true);
      }

    } catch (err) {
      console.error("Verification error:", err);
      setCustomerName("");
      setCustomerAddress("");
      setIsVerified(false);
      setErrorMessage("Network error. Could not verify meter.");
      setErrorVisible(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const goToResult = (success: boolean, token?: string) => {
    const params = buildReceiptParams(token);
    resetForm();
    router.replace({
      pathname: success
        ? "/dashboard/electricity/electricity-success"
        : "/dashboard/electricity/electricity-failed",
      params,
    });
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
      fetchBalance();
      loadFinger();
      return undefined;
    }, [])
  );

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

  useEffect(() => {
    if (meterNumber.length >= 5 && selectedDistributor && selectedMeterType) {
      const delayDebounceFn = setTimeout(() => {
        validateMeter(meterNumber, selectedDistributor.id, selectedMeterType);
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsVerified(false);
      setCustomerName("");
      setErrorMessage("");
      setErrorVisible(false);
    }
  }, [meterNumber, selectedDistributor, selectedMeterType]);

  const handleElectricityPurchase = async (finalPin: string) => {
    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        setAlertTitle("Session Expired");
        setAlertMessage("Please login again.");
        setAlertVisible(true);
        return;
      }

      const response = await fetch(endPoints.purchaseElectricity, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: userToken,
          meter: meterNumber,
          serviceID: selectedDistributor?.id,
          type: selectedMeterType?.toLowerCase(),
          amount: amount,
          phone: phoneNumber,
          pin: finalPin,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPinVisible(false);
        setBalance(data.balance);
        goToResult(true, data.token);
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
        await handleElectricityPurchase("fingerprint");
      }
    } catch (error) {
      console.error("Fingerprint auth error:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { marginTop: -30, backgroundColor: colors.background }]}>
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
         <Header title="Electricity Bill" />

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Distributor</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.networkRow}
            >
              {distributors.map((item) => {
                const isActive = selectedDistributor?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setSelectedDistributor(item);
                      setIsVerified(false);
                      setMeterNumber("");
                      setCustomerName("");
                      setErrorVisible(false);
                      setErrorMessage("");
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.networkCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isActive && [styles.networkCardActive, { borderColor: colors.primary }],
                    ]}
                  >
                    <Image source={item.logo} style={styles.networkLogo} resizeMode="contain" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Or Select Here</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
              onPress={() => setDistributorModal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectText,
                  { color: colors.text },
                  !selectedDistributor && [styles.selectPlaceholder, { color: colors.textMuted }],
                ]}
              >
                {selectedDistributor?.label ?? "Choose a distributor"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.accent} />
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Meter Type</Text>
            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
              onPress={() => setMeterModal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectText,
                  { color: colors.text },
                  !selectedMeterType && [styles.selectPlaceholder, { color: colors.textMuted }],
                ]}
              >
                {selectedMeterType ?? "Choose meter type"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.accent} />
            </TouchableOpacity>

            {selectedDistributor && selectedMeterType && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Meter Number</Text>
                <View style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }]}>
                  <TextInput
                    placeholder="Enter Meter Number"
                    keyboardType="numeric"
                    value={meterNumber}
                    onChangeText={(text) => {
                      setMeterNumber(text);
                      setIsVerified(false);
                      setCustomerName("");
                    }}
                    placeholderTextColor={colors.textMuted}
                    style={[{ color: colors.text, flex: 1, height: '100%' }]}
                  />
                  {isVerifying ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    isVerified && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  )}
                </View>

                {isVerified && customerName && (
                  <View style={{ marginTop: 3 }}>
                    <Text style={{ color: "green", fontWeight: "bold" }}>
                      ✔ {customerName}
                    </Text>

                    {customerAddress ? (
                      <Text style={{ color: isDark ? "#fff" : "#555", marginTop: 4, marginBottom: 10 }}>
                        Address: {customerAddress}
                      </Text>
                    ) : null}
                  </View>
                )}

                {errorVisible && errorMessage && (
                  <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600', marginBottom: 15, marginTop: -10 }}>
                    ❌ {errorMessage}
                  </Text>
                )}
              </>
            )}

            {isVerified && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Amount</Text>
                <TextInput
                  placeholder="Min ₦1000"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder, color: colors.text }]}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                <TextInput
                  placeholder="Recipient Phone"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.inputBorder, color: colors.text }]}
                  maxLength={11}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.continueButton, loading && { opacity: 0.6 }]}
                  disabled={loading}
                  onPress={() => {
                    const amountValue = Number(amount) || 0;
                    if (amountValue < 1000) {
                      setAlertTitle("Invalid Amount");
                      setAlertMessage("Minimum amount is ₦1000.");
                      setAlertVisible(true);
                      return;
                    }
                    if (phoneNumber.length !== 11) {
                      setAlertTitle("Invalid Phone");
                      setAlertMessage("Please enter a valid 11-digit phone number.");
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
        isVisible={distributorModal}
        onBackdropPress={() => setDistributorModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Distributor</Text>
          {distributors.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSelectedDistributor(item);
                setIsVerified(false);
                setMeterNumber("");
                setCustomerName("");
                setErrorVisible(false);
                setErrorMessage("");
                setDistributorModal(false);
              }}
            >
              <Image source={item.logo} style={styles.modalLogo} resizeMode="contain" />
              <Text style={[styles.modalItemText, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <Modal
        isVisible={meterModal}
        onBackdropPress={() => setMeterModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Meter Type</Text>
          {meterTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSelectedMeterType(type);
                setIsVerified(false);
                setMeterNumber("");
                setCustomerName("");
                setErrorVisible(false);
                setErrorMessage("");
                setMeterModal(false);
              }}
            >
              <Text style={[styles.modalItemText, { color: colors.text }]}>{type}</Text>
            </TouchableOpacity>
          ))}
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
                <Text style={[styles.confirmTitle, { color: colors.text }]}>Confirm Payment</Text>
                <Text style={[styles.confirmSubtitle, { color: colors.textMuted }]}>
                  Please verify details carefully
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.confirmBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Distributor:</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedDistributor?.label}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Meter Type:</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedMeterType}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Meter Number:</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{meterNumber}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Customer Name:</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{customerName}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Amount:</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>₦{Number(amount).toLocaleString()}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Phone Number:</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{phoneNumber}</Text>
              </View>
            </View>

            <View style={[styles.balanceCard, { backgroundColor: isDark ? colors.surface : "#f8fbff", borderColor: colors.border }]}>
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Wallet Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceSmall, { color: colors.textMuted }]}>Available Balance</Text>
                <Text style={[styles.balanceValue, { color: colors.primary }]}>₦{balance.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDark ? colors.surface : "#f1f5f9", borderColor: colors.secondary }]}
                onPress={() => setConfirmVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancel</Text>
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
                  <Text style={styles.payText}>Pay Now</Text>
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
        <View style={[styles.pinScreen, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            onPress={() => setPinVisible(false)}
            style={styles.pinBack}
          >
            <Text style={[styles.pinBackText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>

          <View style={styles.pinContent}>
            <Text style={[styles.pinTitle, { color: colors.text }]}>Enter Passcode</Text>
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={`dot-${idx}`}
                  style={[
                    styles.pinDot,
                    { backgroundColor: colors.border },
                    pin.length > idx && [styles.pinDotActive, { backgroundColor: colors.primary }],
                  ]}
                />
              ))}
            </View>
            {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
          </View>

          <View style={styles.pinBottom}>
            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                  key={`key-${num}`}
                  style={[styles.keyButton, { backgroundColor: isDark ? colors.surface : "#f8fafc" }]}
                  onPress={() => {
                    setPin((prev) => (prev.length < 4 ? `${prev}${num}` : prev));
                  }}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.keyButton, styles.keyButtonGhost, { backgroundColor: isDark ? colors.border : "#f6f8ff" }]}
                onPress={() => setPin((prev) => prev.slice(0, -1))}
              >
                <Ionicons name="backspace-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keyButton, { backgroundColor: isDark ? colors.surface : "#f8fafc" }]}
                onPress={() => {
                  setPin((prev) => (prev.length < 4 ? `${prev}0` : prev));
                }}
              >
                <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keyButton, styles.keyButtonGhost, { backgroundColor: isDark ? colors.border : "#f6f8ff" }]}
                onPress={() => {
                  if (pin.length < 4) {
                    setAlertTitle("Incomplete PIN");
                    setAlertMessage("Please enter your 4-digit PIN.");
                    setAlertVisible(true);
                    return;
                  }
                  handleElectricityPurchase(pin);
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
                <Text style={[styles.fingerprintText, { color: colors.textMuted }]}>Pay with biometric</Text>
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
    paddingTop: 70,
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

export default Electricity;
