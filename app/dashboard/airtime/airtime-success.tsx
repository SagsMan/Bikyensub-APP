import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SuccessIcon } from "@/constants/images";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { APPNAME } from "@/constants/variables";

const AirtimeSuccess = () => {
  const { isDark, colors } = useTheme();
  const { network, phoneNumber, amount, discount, amountToPay } =
    useLocalSearchParams<{
      network?: string;
      phoneNumber?: string;
      amount?: string;
      discount?: string;
      amountToPay?: string;
    }>();

  const amountValue = Number(amount) || 0;
  const amountPayValue = Number(amountToPay) || 0;

  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true, // ✅ required in newer versions
      shouldShowList: true, // ✅ required in newer versions
    }),
  });

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const sendNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
      },
      trigger: null, // 🔥 instant
    });
  };

  const triggerVibration = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await sendNotification(
      "Airtime Send Successful",
      `₦${amount} sent to ${phoneNumber}`,
    );
  };

  // 🔥 Fetch Balance Function
  const getBalance = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) {
        console.log("No token found");
        return;
      }

      const response = await fetch(endPoints.getBalance, {
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
      triggerVibration();
    }, []),
  );
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topSection}>
          <Image source={SuccessIcon} style={styles.successImage} />
          <Text style={[styles.successTitle, { color: colors.primary }]}>
            Transaction Successful
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
            Thank you For Using {APPNAME}
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: isDark ? colors.surface : "#ffffff",
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Network:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {network || "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Phone Number:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {phoneNumber || "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Amount
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {amountValue ? `₦${amountValue.toLocaleString()}` : "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Discount
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {discount ? `${discount}%` : "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Amount Payed
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {amountPayValue ? `₦${amountPayValue.toLocaleString()}` : "-"}
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
              <Text style={[styles.balanceSmall, { color: colors.textMuted }]}>
                Balance after
              </Text>
              <Text style={[styles.balanceValue, { color: colors.primary }]}>
                ₦{balance.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.outlineButton, { borderColor: colors.secondary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.outlineText, { color: colors.secondary }]}>
                Receipt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fillButton}
              activeOpacity={0.85}
              onPress={() => router.replace("/dashboard")}
            >
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fillGradient}
              >
                <Text style={styles.fillText}>Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  successImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2b2e80",
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  bottomSection: {
    gap: 14,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: "#dce4ff",
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
  },
  value: {
    fontSize: 12,
    color: "#1a1f36",
    fontWeight: "600",
  },
  balanceCard: {
    borderWidth: 1,
    borderColor: "#dce4ff",
    borderRadius: 16,
    padding: 14,
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
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  outlineButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: "center",
  },
  outlineText: {
    fontWeight: "600",
  },
  fillButton: {
    flex: 1,
  },
  fillGradient: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  fillText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

export default AirtimeSuccess;
