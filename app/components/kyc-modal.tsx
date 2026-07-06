import { User } from "@/constants/types";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Ionicons from "react-native-vector-icons/Ionicons";
import useUserStore from "../states/user";
import AlertModal from "./AlertModal";
import GradientButton from "./buttons";

const IdentityVerificationModal = ({
  visible = true,
  onClose,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}) => {
  const { isDark, colors } = useTheme();
  const [isBVN, setIsBVN] = useState(true);
  const [nin, setNIN] = useState("");
  const [bvn, setBVN] = useState("");
  const [isLoading, setisLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [buttonTitle, setButtonTitle] = useState("Proceed");

  const submit = async () => {
    if (!nin && !bvn) {
      setAlertVisible(true);
      setAlertTitle("Warning");
      setAlertMessage("Please enter your BVN or NIN");
      return;
    }
    setisLoading(true);
    setButtonTitle("Processing KYC...");
    try {
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) return;

      const response = await fetch(endPoints.kyc, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": userToken,
        },
        body: JSON.stringify({
          nin,
          bvn,
        }),
      });

      const data = await response.json();

      if (data.status !== "success") {
        setAlertVisible(true);
        setAlertTitle("Failed");
        setAlertMessage(data.data.message);
        setButtonTitle("Proceed");
        onClose();
      }

      console.log(data);

      setButtonTitle("Generating account...");

      const res = await getAccountDetails();

      if (res.status === "error") {
        setAlertVisible(true);
        setAlertTitle("Failed");
        setAlertMessage(res.message);
        setButtonTitle("Proceed");
        onClose();
        return;
      }

      await useUserStore.getState().refreshDashboard();
      setAlertVisible(true);
      setAlertTitle("Successful");
      setAlertMessage("Account generated successfully");

      onClose();
    } catch (error) {
      console.error("Account fetch error:", error);
    } finally {
      setisLoading(false);
      setButtonTitle("Proceed");
    }
  };

  const getAccountDetails = async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) return;

      const response = await fetch(endPoints.getAccountDetails, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: userToken }),
      });

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Account fetch error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal transparent animationType="slide" visible={visible}>
        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.overlay}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: "#3a3838",
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Identity Verification</Text>

                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Info Box */}
              <View
                style={[styles.infoBox, { backgroundColor: colors.accent }]}
              >
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color={colors.onPrimary}
                  />
                </View>

                <Text style={styles.infoText}>
                  Please provide valid information. Note that information
                  verification is limited to 3 attempts per day. Continuous
                  attempts with invalid information may result in your account
                  being blocked.
                </Text>
              </View>

              {/* Full Name */}
              {/* <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>

                <TextInput
                  placeholder={user?.name ?? "Full Name"}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View> */}

              {/* Identity Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Identity Type</Text>

                <View style={styles.identityRow}>
                  <TouchableOpacity
                    style={[
                      styles.identityButton,
                      { backgroundColor: isBVN ? colors.accent : undefined },
                    ]}
                    onPress={() => {
                      setIsBVN(true);
                    }}
                  >
                    <Text
                      style={[styles.identityText, { color: colors.onPrimary }]}
                    >
                      BVN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.identityButton,
                      { backgroundColor: !isBVN ? colors.accent : undefined },
                    ]}
                    onPress={() => {
                      setIsBVN(false);
                    }}
                  >
                    <Text
                      style={[styles.identityText, { color: colors.onPrimary }]}
                    >
                      NIN
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Identity Number */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Identity Number</Text>

                <TextInput
                  placeholder="Identity Number"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    isBVN ? setBVN(val) : setNIN(val);
                  }}
                />
              </View>

              {/* Date of Birth */}
              {/* <View style={styles.formGroup}>
              <Text style={styles.label}>Date of birth</Text>

              <TextInput
                placeholder="Date of birth"
                placeholderTextColor="#A9A9A9"
                style={styles.input}
              />
            </View> */}

              {/* Proceed Button */}

              <GradientButton title={buttonTitle} onPress={submit} />
            </View>
          </View>
        </KeyboardAwareScrollView>
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

export default IdentityVerificationModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },

  infoBox: {
    backgroundColor: "#2643C4",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },

  infoText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },

  formGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 10,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },

  identityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  identityButton: {
    width: "48%",
    height: 56,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  identityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
  },

  proceedButton: {
    marginTop: 14,
    height: 58,
    backgroundColor: "#B6B6B6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  proceedText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
