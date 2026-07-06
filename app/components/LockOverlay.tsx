import { AppLogo } from "@/constants/images";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AlertModal from "./AlertModal";
import GradientButton from "./buttons";
import { endPoints } from "@/constants/urls";

interface LockOverlayProps {
  onUnlock: () => void;
}

const LockOverlay: React.FC<LockOverlayProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fingerEnabled, setFingerEnabled] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        const storedFinger = await AsyncStorage.getItem("finger");

        if (userData) {
          const parsed = JSON.parse(userData);
          setEmail(parsed.email || "");
          setUserName(parsed.name || "User");
        }

        if (storedFinger === "1") {
          setFingerEnabled(true);
          // Auto-trigger fingerprint on mount
          handleFingerprintUnlock();
        }
      } catch (error) {
        console.error("Error loading lock user data:", error);
      }
    };
    loadUserData();
  }, []);

  const handleFingerprintUnlock = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock ",
      fallbackLabel: "Use Password",
    });

    if (result.success) {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          setAlertTitle("Error");
          setAlertMessage("No saved session found.");
          setAlertVisible(true);
          return;
        }

        const response = await fetch(
        endPoints.verifyToken,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          },
        );

        const json = await response.json();
        if (json.success) {
          onUnlock();
        } else {
          setAlertTitle("Session Expired");
          setAlertMessage("Please login with your password.");
          setAlertVisible(true);
        }
      } catch (err) {
        setAlertTitle("Error");
        setAlertMessage("Connection error. Try again.");
        setAlertVisible(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePasswordUnlock = async () => {
    if (password.length < 4) {
      setAlertTitle("Error");
      setAlertMessage("Please enter your login password.");
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(endPoints.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();

      if (json.success) {
        // ✅ CRITICAL: Update storage with new token to prevent background expiration
        await AsyncStorage.setItem("user", JSON.stringify(json.user));
        await AsyncStorage.setItem("userToken", json.token);
        await AsyncStorage.setItem("finger", json.finger);

        onUnlock();
      } else {
        setAlertTitle("Unlock Failed");
        setAlertMessage(json.message || "Invalid password");
        setAlertVisible(true);
      }
    } catch (err) {
      setAlertTitle("Error");
      setAlertMessage("Connection error. Please try again.");
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.7)" },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            centerContent
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Image source={AppLogo} style={styles.logo} />
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.instruction}>
                The app is locked for your security. Please authenticate to
                continue.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter login password"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <GradientButton
                title="Unlock App"
                onPress={handlePasswordUnlock}
                loading={isLoading}
              />

              {fingerEnabled && (
                <TouchableOpacity
                  onPress={handleFingerprintUnlock}
                  style={styles.fingerprintButton}
                >
                  <Ionicons name="finger-print" size={40} color="#2b6cb0" />
                  <Text style={styles.fingerprintText}>Use Biometric</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <AlertModal
        isVisible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: 150,
    height: 30,
    resizeMode: "contain",
    marginBottom: 25,
  },
  greeting: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 10,
  },
  instruction: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 18,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    color: "#1e293b",
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  fingerprintButton: {
    marginTop: 30,
    alignItems: "center",
  },
  fingerprintText: {
    marginTop: 8,
    fontSize: 14,
    color: "#2b6cb0",
    fontWeight: "500",
  },
});

export default LockOverlay;
