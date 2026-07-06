import { AppLogo } from "@/constants/images";
import { endPoints } from "@/constants/urls";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import AlertModal from "./components/AlertModal";
import GradientButton from "./components/buttons";

const ForgotPassword = () => {
  const { isDark, colors } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const handleResetRequest = async () => {
    if (!email || email.length < 5 || !email.includes("@")) {
      setAlertTitle("Invalid Email");
      setAlertMessage("Please enter a valid email address.");
      setAlertVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(endPoints.resetPassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const json = await response.json();

      if (json.success) {
        setAlertTitle("Email Sent");
        setAlertMessage(
          json.message ||
            "Password reset instructions have been sent to your email.",
        );
        setAlertVisible(true);
        // We stay on this page to let them read the message, or they can go back
      } else {
        setAlertTitle("Request Failed");
        setAlertMessage(
          json.message || "We couldn't process your request. Please try again.",
        );
        setAlertVisible(true);
      }
    } catch (err) {
      console.log(err);
      setAlertTitle("Connection Error");
      setAlertMessage(
        "Something went wrong. Please check your internet connection.",
      );
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, padding: 20 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text
            style={{
              marginLeft: 8,
              color: colors.primary,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 20, marginBottom: 40 }}>
            <Image
              source={AppLogo}
              style={{ width: 150, height: 30, alignSelf: "center" }}
            />
            <Text
              style={{
                marginTop: 30,
                color: colors.primary,
                fontSize: 27,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Reset Password
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textMuted,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Enter your email address and we'll send you instructions to reset
              your password.
            </Text>
          </View>

          <View>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
                marginBottom: 6,
                marginLeft: 3,
              }}
            >
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="example@gmail.com"
              placeholderTextColor={colors.textMuted}
              style={{
                height: 50,
                borderColor: colors.inputBorder,
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 14,
                marginBottom: 30,
                color: colors.text,
                backgroundColor: colors.surface,
              }}
            />
          </View>

          <GradientButton
            loading={isLoading}
            title="Send Reset Instructions"
            onPress={handleResetRequest}
          />
        </ScrollView>

        <AlertModal
          isVisible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => {
            setAlertVisible(false);
            if (alertTitle === "Email Sent") {
              router.back();
            }
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
