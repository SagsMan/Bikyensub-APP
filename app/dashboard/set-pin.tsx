import AlertModal from "@/app/components/AlertModal";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SetPin = () => {
  const { isDark, colors } = useTheme();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  const handleSubmitPin = async () => {
    if (pin.length < 4) {
      setAlertTitle("Incomplete PIN");
      setAlertMessage("Please enter your 4-digit PIN.");
      setAlertVisible(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        setAlertTitle("Missing Token");
        setAlertMessage("Please login again to continue.");
        setAlertVisible(true);
        return;
      }

      const response = await fetch(endPoints.setPin, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: userToken, pin }),
      });

      const json = await response.json();

      if (json.success) {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.haspin = true;
          await AsyncStorage.setItem("user", JSON.stringify(parsed));
        }

        // Play success vibration
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        setAlertTitle("Success");
        setAlertMessage(json.message || "PIN set successfully.");
        setAlertVisible(true);
        setTimeout(() => {
          setAlertVisible(false);
          router.replace("/dashboard");
        }, 1200);
      } else {
        setAlertTitle("Failed");
        setAlertMessage(json.message || "Unable to set PIN.");
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

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.pinContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            Set Transaction PIN
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Please set a 4-digit transaction pin to complete your account setup.
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
        </View>

        <View style={styles.pinBottom}>
          <View style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={`key-${num}`}
                style={[
                  styles.keyButton,
                  {
                    backgroundColor: isDark ? colors.surface : "#ffffff",
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setPin((prev) => (prev.length < 4 ? `${prev}${num}` : prev));
                }}
                disabled={isLoading}
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
              disabled={isLoading}
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
                {
                  backgroundColor: isDark ? colors.surface : "#ffffff",
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                setPin((prev) => (prev.length < 4 ? `${prev}0` : prev));
              }}
              disabled={isLoading}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.keyButton,
                styles.keyButtonGhost,
                { backgroundColor: isDark ? colors.border : "#f6f8ff" },
              ]}
              onPress={handleSubmitPin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 70,
    alignItems: "center",
  },
  pinContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2b6d",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  pinDots: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
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
    marginTop: 10,
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
});

export default SetPin;
