import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

import { AppLogo } from "@/constants/images";
import { styles } from "@/constants/styles";
import { endPoints } from "@/constants/urls";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import AlertModal from "./components/AlertModal";
import GradientButton from "./components/buttons";

const Login = () => {
  const { isDark, colors } = useTheme();
  const [loggedinEmail, setLoggedinEmail] = useState("");

  useEffect(() => {
    const loadEmail = async () => {
      const raw = await AsyncStorage.getItem("user");
      if (raw) {
        const user = JSON.parse(raw);
        setEmail(user?.email || "");
      }
    };

    loadEmail();
  }, []);

  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [finger, setFinger] = useState<boolean>(false);

  useEffect(() => {
    const getFingerFromStorage = async () => {
      try {
        const storedFinger = await AsyncStorage.getItem("finger");

        if (storedFinger !== null) {
          setFinger(storedFinger === "1"); // convert string → boolean
        }
      } catch (error) {
        console.error("Error retrieving finger from storage:", error);
      }
    };

    getFingerFromStorage();
  }, []);

  const handleFingerprintLogin = async () => {
    // Check if device supports biometrics
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      alert("Device does not support fingerprint");
      return;
    }

    // Authenticate user
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Fingerprint",
    });

    if (result.success) {
      try {
        // ✅ Get stored token
        const token = await AsyncStorage.getItem("userToken");

        if (!token) {
          alert("No saved login session");
          return;
        }

        // ✅ Send token to server
        const response = await fetch(endPoints.verifyToken, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const json = await response.json();

        if (json.success) {
          router.replace("/dashboard");
        } else {
          alert("Session expired. Please login again.");
        }
      } catch (err) {
        console.log(err);
        alert("Error verifying session");
      }
    } else {
      alert("Fingerprint failed");
    }
  };

  const handleLogin = async () => {
    if (email.length < 4 || password.length < 4) {
      setAlertTitle("Validation Error");
      setAlertMessage("Email and password must be at least 4 characters.");
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(endPoints.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();

      if (json.success) {
        // ✅ STORE TOKEN
        await AsyncStorage.setItem("user", JSON.stringify(json.user));
        await AsyncStorage.setItem("userToken", json.token);
        await AsyncStorage.setItem("finger", json.finger);

        setAlertTitle("Success");
        setAlertMessage(json.message);
        setAlertVisible(true);

        router.replace("/dashboard");
      } else {
        setAlertTitle("Login Failed");
        setAlertMessage(json.message || "Invalid credentials");
        setAlertVisible(true);
      }
    } catch (err) {
      console.log(err);
      setAlertTitle("Error");
      setAlertMessage("Something went wrong. Please try again.");
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, padding: 20, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 3 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: 40, marginBottom: 50 }}>
          <View style={[styles.LogoImg, { alignSelf: "center" }]}>
            <Image source={AppLogo} style={styles.LogoImgB} />
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: 27,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Login
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            Welcome back! Kindly enter your details to Login!
          </Text>
        </View>

        {/* Email Input */}
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 3,
            }}
          >
            Enter Email Address
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={colors.textMuted}
            style={{
              height: 50,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              marginBottom: 20,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />
        </View>

        {/* Password Input */}
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 3,
            }}
          >
            Enter Password
          </Text>
          <View
            style={{
              height: 50,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: colors.surface,
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, color: colors.text }}
            />
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textMuted}
              onPress={() => setShowPassword(!showPassword)}
            />
          </View>
          <TouchableOpacity
            onPress={() => router.push("/ForgotPassword")}
            style={{ alignSelf: "flex-end", marginBottom: 20, marginTop: -10 }}
          >
            <Text
              style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <GradientButton
          loading={isLoading}
          title="Login"
          onPress={handleLogin}
        />

        {/* Fingerprint Login */}

        {finger && (
          <TouchableOpacity
            onPress={() => {
              setStateModalVisible(true);
              handleFingerprintLogin();
            }}
          >
            <Image
              source={require("@/assets/images/fingerprint.png")}
              style={{
                width: 60,
                height: 60,
                alignSelf: "center",
                marginTop: 60,
              }}
            />
            <Text
              style={{
                fontSize: 16,
                marginBottom: 100,
                textAlign: "center",
                marginTop: 10,
                color: colors.text,
              }}
            >
              Or Login with Fingerprint
            </Text>
          </TouchableOpacity>
        )}

        {/* Go to Register */}
        <TouchableOpacity onPress={() => router.push("/Register")}>
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              marginTop: 20,
              color: colors.text,
            }}
          >
            Don't Have an Account?
          </Text>
        </TouchableOpacity>

        {/* Fingerprint Modal */}
        <Modal
          isVisible={stateModalVisible}
          onBackdropPress={() => setStateModalVisible(false)}
          style={{ justifyContent: "flex-end", margin: 0 }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "60%",
              padding: 16,
            }}
          >
            <Image
              source={require("@/assets/images/fingerprint.png")}
              style={{
                width: 60,
                height: 60,
                alignSelf: "center",
                marginTop: 60,
              }}
            />
            <Text
              style={{
                fontSize: 16,
                marginBottom: 30,
                textAlign: "center",
                marginTop: 10,
                color: colors.primary,
              }}
            >
              Place your finger on the fingerprint scanner to Login
            </Text>
          </View>
        </Modal>

        {/* Alert Modal */}
        <AlertModal
          isVisible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
