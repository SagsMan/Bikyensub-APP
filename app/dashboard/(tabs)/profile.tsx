import AlertModal from "@/app/components/AlertModal";
import Header from "@/app/components/header";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

const Avatar = require("@/assets/images/avater.png");

type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

const Profile = () => {
  const { isDark, toggleTheme, colors } = useTheme();
  const [nameModal, setNameModal] = React.useState(false);
  const [phoneModal, setPhoneModal] = React.useState(false);
  const [passwordModal, setPasswordModal] = React.useState(false);

  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [verificationPassword, setVerificationPassword] = React.useState("");
  const [isFingerEnabled, setIsFingerEnabled] = useState(false);
  const [updatingFinger, setUpdatingFinger] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinVerifyModal, setPinVerifyModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [user, setUser] = useState<User | null>(null);

  const handleFingerprintToggle = async (value: boolean) => {
    try {
      // Step 1: Verify identity before changing settings
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: value ? "Enable Fingerprint" : "Disable Fingerprint",
      });

      if (!result.success) {
        // Revert toggle state if authentication fails
        return;
      }

      setUpdatingFinger(true);
      setIsFingerEnabled(value);
      await AsyncStorage.setItem("finger", value ? "1" : "0");

      const userToken = await AsyncStorage.getItem("userToken");
      if (userToken) {
        const response = await fetch(endPoints.fingerPrintSetting, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: userToken }),
        });

        const data = await response.json();

        // Step 2: Push notification on success
        if (data.success) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Security Updated",
              body: value
                ? "Fingerprint authentication enabled"
                : "Fingerprint authentication disabled",
              sound: true,
            },
            trigger: null,
          });
        }
      }
    } catch (error) {
      console.error("Error updating fingerprint setting:", error);
    } finally {
      setUpdatingFinger(false);
    }
  };

  useEffect(() => {
    Notifications.requestPermissionsAsync();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false, // deprecated
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setFullName(parsedUser.name || "");
          setPhone(parsedUser.phone || "");
        }

        const fingerSetting = await AsyncStorage.getItem("finger");
        setIsFingerEnabled(fingerSetting === "1");
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUser();
  }, []);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !password || !confirmPassword) {
      setAlertTitle("Empty Fields");
      setAlertMessage("All password fields are required");
      setAlertVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setAlertTitle("Mismatch");
      setAlertMessage("New passwords do not match");
      setAlertVisible(true);
      return;
    }

    if (password.length < 6) {
      setAlertTitle("Too Short");
      setAlertMessage("Password must be at least 6 characters");
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      // 1️⃣ First Verify Current Password (this will give us a fresh token)
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;
      const parsedUser = JSON.parse(userData);

      const loginRes = await fetch(endPoints.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsedUser.email,
          password: currentPassword,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginData.success) {
        setAlertTitle("Verification Failed");
        setAlertMessage(loginData.message || "Incorrect current password");
        setAlertVisible(true);
        return;
      }

      // ✅ Update fresh session tokens locally
      await AsyncStorage.setItem("user", JSON.stringify(loginData.user));
      await AsyncStorage.setItem("userToken", loginData.token);
      await AsyncStorage.setItem("finger", loginData.finger);

      // 2️⃣ Now Update to New Password using the FRESH token
      const response = await fetch(endPoints.setPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: loginData.token,
          type: "loginPassword",
          value: password,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Play success vibration
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        setAlertTitle("Success");
        setAlertMessage("Password updated successfully");
        setAlertVisible(true);
        setPasswordModal(false);
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setAlertTitle("Update Failed");
        setAlertMessage(data.message || "Unable to update password");
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage("Something went wrong. Please try again.");
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPasswordBeforePin = async () => {
    if (verificationPassword.length < 4) return;

    setIsLoading(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;
      const parsedUser = JSON.parse(userData);

      const response = await fetch(endPoints.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsedUser.email,
          password: verificationPassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // ✅ CRITICAL: Update storage with new token returned by login.php
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("userToken", data.token);
        await AsyncStorage.setItem("finger", data.finger);

        setPinVerifyModal(false);
        setVerificationPassword("");
        router.push("/dashboard/set-pin");
      } else {
        setAlertTitle("Verification Failed");
        setAlertMessage(data.message || "Incorrect password");
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage("Something went wrong. Please try again.");
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["userToken", "user", "finger"]);
      router.replace("/Login");
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage("Failed to logout. Please try again.");
      setAlertVisible(true);
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
          <Header title="My Profile" />

          <View style={styles.content}>
            <View style={styles.avatarWrap}>
              <Image source={Avatar} style={styles.avatarImage} />
            </View>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.name}
            </Text>
            <Text style={[styles.phone, { color: colors.textMuted }]}>
              {user?.email}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal info
            </Text>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoLeft}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Full Name
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                  {fullName}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoLeft}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Email Address
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                  {user?.email}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoLeft}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Phone
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                  {phone}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Security Settings
            </Text>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoLeft}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Login Password
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                  ****
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPasswordModal(true)}>
                <Text style={[styles.infoAction, { color: colors.icon }]}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoLeft}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Transaction Pin
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                  ****
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPinVerifyModal(true)}>
                <Text style={[styles.infoAction, { color: colors.icon }]}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoLeft}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Fingerprint Locking
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                  Use biometric for faster payments
                </Text>
              </View>
              <Switch
                value={isFingerEnabled}
                onValueChange={handleFingerprintToggle}
                trackColor={{ false: "#d1d5db", true: colors.primary }}
                thumbColor={Platform.OS === "ios" ? undefined : "#ffffff"}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Appearance
            </Text>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoLeft}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMuted }]}>
                  Switch between light and dark themes
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#d1d5db", true: colors.primary }}
                thumbColor={Platform.OS === "ios" ? undefined : "#ffffff"}
              />
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={() => setLogoutModal(true)}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        isVisible={nameModal}
        onBackdropPress={() => setNameModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Update Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            style={styles.modalInput}
          />
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setNameModal(false)}
          >
            <Text style={styles.modalButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={phoneModal}
        onBackdropPress={() => setPhoneModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Update Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            style={styles.modalInput}
          />
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setPhoneModal(false)}
          >
            <Text style={styles.modalButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={passwordModal}
        onBackdropPress={() => setPasswordModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Update Password
          </Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleUpdatePassword}
            disabled={isLoading}
          >
            <Text style={styles.modalButtonText}>
              {isLoading ? "Updating..." : "Update"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={pinVerifyModal}
        onBackdropPress={() => setPinVerifyModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Security Check
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
            Please enter your login password to update PIN
          </Text>
          <TextInput
            value={verificationPassword}
            onChangeText={setVerificationPassword}
            placeholder="Login Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleVerifyPasswordBeforePin}
            disabled={isLoading}
          >
            <Text style={styles.modalButtonText}>
              {isLoading ? "Verifying..." : "Verify"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={logoutModal}
        onBackdropPress={() => setLogoutModal(false)}
        style={styles.modal}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Log Out
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
            Are you sure you want to log out of your account?
          </Text>
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: "#d14343", marginBottom: 10 },
            ]}
            onPress={() => {
              setLogoutModal(false);
              handleLogout();
            }}
          >
            <Text style={styles.modalButtonText}>Yes, Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              {
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setLogoutModal(false)}
          >
            <Text style={[styles.modalButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
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
    paddingTop: 30,
    alignItems: "center",
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#2b6cb0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1f36",
  },
  phone: {
    fontSize: 12,
    color: "#8a94a6",
    marginTop: 4,
  },
  sectionTitle: {
    alignSelf: "flex-start",
    marginTop: 24,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1f36",
  },
  infoCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e4e9ff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLeft: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#1a1f36",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    color: "#6b7280",
  },
  infoAction: {
    fontSize: 12,
    color: "#2b2e80",
    fontWeight: "600",
  },
  modal: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  modalCard: {
    width: "85%",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1f36",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7dcf4",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: "#2b2e80",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutButton: {
    width: "100%",
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff1f1",
    borderWidth: 1.5,
    borderColor: "#d14343",
  },
  logoutText: {
    color: "#d14343",
    fontSize: 15,
    fontWeight: "700",
  },
  modalButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

export default Profile;
