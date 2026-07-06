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

const exams = [
  { id: "waec", label: "WAEC", logo: require("@/assets/images/waec.png") },
  { id: "neco", label: "NECO", logo: require("@/assets/images/neco.png") },
  {
    id: "nabteb",
    label: "NABTEB",
    logo: require("@/assets/images/nabteb.png"),
  },
  { id: "nbais", label: "NBAIS", logo: require("@/assets/images/nbais.png") },
  { id: "jamb", label: "JAMB", logo: require("@/assets/images/jamb.png") }, // ✅ added
];

const quantities = ["1", "2", "3", "4", "5"];

const Exams = () => {
  const { isDark, colors } = useTheme();
  const [selectedExam, setSelectedExam] = useState<{
    id: string;
    label: string;
    logo: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState(""); // for JAMB

  const [selectedQty, setSelectedQty] = useState<string | null>("1");
  const [examModal, setExamModal] = useState(false);
  const [qtyModal, setQtyModal] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [amount, setAmount] = useState("₦1,200");
  const [pin, setPin] = useState("");
  const [fingerEnabled, setFingerEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const resetForm = () => {
    setSelectedExam(null);
    setSelectedQty("1");
    setAmount("₦1,200");
    setPin("");
    setConfirmVisible(false);
    setExamModal(false);
    setQtyModal(false);
    setPinVisible(false);
  };

  const buildReceiptParams = () => ({
    exam: selectedExam?.label ?? "",
    quantity: selectedQty ?? "",
    amount,
  });

  const goToResult = (success: boolean) => {
    const params = buildReceiptParams();
    resetForm();
    router.replace({
      pathname: success
        ? "/dashboard/exam/exams-success"
        : "/dashboard/exam/exams-failed",
      params: params,
    });
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
      loadFinger();
      return undefined;
    }, []),
  );

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

      setPinVisible(false);
      handlePayment("fingerprint");
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage("Unable to authenticate with fingerprint.");
      setAlertVisible(true);
    }
  };

  const handlePayment = async (userPin: string) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("User not authenticated");
      }
      if (selectedExam?.id === "jamb" && !profileId) {
        setAlertTitle("Missing Profile ID");
        setAlertMessage("Enter JAMB Profile ID");
        setAlertVisible(true);
        return;
      }

      // loop for quantity
      let allPins: any[] = [];

      for (let i = 0; i < Number(selectedQty); i++) {
        const response = await fetch(
          endPoints.buyEducationPin,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
              service: selectedExam?.id,
              number: "08000000000", // you can replace with user phone
              pin: userPin,
              profileId: selectedExam?.id === "jamb" ? profileId : undefined,
            }),
          },
        );

        const res = await response.json();

        if (!res.success) {
          throw new Error(res.message || "Transaction failed");
        }

        if (res.pins) {
          allPins = [...allPins, ...res.pins];
        }
      }

      setLoading(false);
      setPinVisible(false);
      const params = {
        ...buildReceiptParams(),
        pins: JSON.stringify(allPins),
      };
      resetForm();

      // 👉 Navigate with pins
      router.replace({
        pathname: "/dashboard/exam/exams-success",
        params: params,
      });
    } catch (error: any) {
      setLoading(false);

      setAlertTitle("Transaction Failed");
      setAlertMessage(error.message || "Service unavailable");
      setAlertVisible(true);

      goToResult(false);
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
          <Header title="Exam Token" />

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Exams Type
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.networkRow}
            >
              {exams.map((item) => {
                const isActive = selectedExam?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedExam(item)}
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
                    <Image source={item.logo} style={styles.networkLogo} />
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
              onPress={() => setExamModal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectText,
                  { color: colors.text },
                  !selectedExam && [
                    styles.selectPlaceholder,
                    { color: colors.textMuted },
                  ],
                ]}
              >
                {selectedExam?.label ?? "Choose an exam"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.accent} />
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Quantity
            </Text>
            <TouchableOpacity
              style={[
                styles.selectInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                },
              ]}
              onPress={() => setQtyModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.selectText, { color: colors.text }]}>
                {selectedQty ?? "1"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.accent} />
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Amount
            </Text>
            <TextInput
              placeholder=""
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

            {selectedExam?.id === "jamb" && (
              <>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  JAMB Profile ID
                </Text>
                <TextInput
                  placeholder="Enter profile ID"
                  value={profileId}
                  onChangeText={setProfileId}
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

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.continueButton}
              onPress={() => {
                if (!selectedExam) {
                  setAlertTitle("Select Exam");
                  setAlertMessage("Please choose an exam type.");
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        isVisible={examModal}
        onBackdropPress={() => setExamModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Select Exam
          </Text>
          {exams.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSelectedExam(item);
                setExamModal(false);
              }}
            >
              <Image source={item.logo} style={styles.modalLogo} />
              <Text style={[styles.modalItemText, { color: colors.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <Modal
        isVisible={qtyModal}
        onBackdropPress={() => setQtyModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Select Quantity
          </Text>
          {quantities.map((qty) => (
            <TouchableOpacity
              key={qty}
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setSelectedQty(qty);
                setQtyModal(false);
              }}
            >
              <Text style={[styles.modalItemText, { color: colors.text }]}>
                {qty}
              </Text>
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
                  Exam Type:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedExam?.label ?? "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Quantity:
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedQty ?? "-"}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text
                  style={[styles.confirmLabel, { color: colors.textMuted }]}
                >
                  Amount
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {amount || "-"}
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
                  Balance
                </Text>
                <Text style={[styles.balanceValue, { color: colors.primary }]}>
                  ₦32,500.00
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
                  { backgroundColor: isDark ? colors.surface : "#f8fafc" },
                ]}
                onPress={() => {
                  if (pin.length < 4) {
                    setAlertTitle("Incomplete PIN");
                    setAlertMessage("Please enter your 4-digit PIN.");
                    setAlertVisible(true);
                    return;
                  }

                  handlePayment(pin); // 🔥 API CALL
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
    width: 80,
    height: 80,
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
    width: 70,
    height: 70,
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

export default Exams;
