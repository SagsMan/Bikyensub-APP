import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
    Alert,
    Clipboard,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SuccessIcon = require("@/assets/images/success.png");

const ElectricitySuccess = () => {
  const { isDark, colors } = useTheme();
  const { distributor, meterType, meterNumber, amount, phoneNumber, token } =
    useLocalSearchParams<{
      distributor?: string;
      meterType?: string;
      meterNumber?: string;
      amount?: string;
      phoneNumber?: string;
      token?: string;
    }>();

  const amountValue = Number(amount) || 0;

  const copyToClipboard = () => {
    if (token) {
      Clipboard.setString(token);
      // Alert.alert("Token Copied", "The token has been copied to your clipboard.");
    }
  };

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
            Electricity Token Generated
          </Text>
        </View>

        <View style={styles.bottomSection}>
          {token && (
            <View
              style={[
                styles.tokenCard,
                {
                  backgroundColor: isDark ? colors.surface : "#f0f9ff",
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>
                YOUR TOKEN
              </Text>
              <Text style={[styles.tokenValue, { color: colors.primary }]}>
                {token}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={copyToClipboard}
              >
                <Ionicons name="copy-outline" size={16} color="#ffffff" />
                <Text style={styles.copyBtnText}>Copy Token</Text>
              </TouchableOpacity>
            </View>
          )}

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
                Distributor:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {distributor || "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Meter Type:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {meterType || "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Meter Number:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {meterNumber || "-"}
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
                Phone Number:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {phoneNumber || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.outlineButton, { borderColor: colors.secondary }]}
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "PDF Receipt feature is currently in development.",
                )
              }
            >
              <Text style={[styles.outlineText, { color: colors.secondary }]}>
                View Receipt
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
    backgroundColor: "#ffffff",
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
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b2e80",
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  bottomSection: {
    gap: 14,
  },
  tokenCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 10,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  tokenValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: "center",
  },
  copyBtn: {
    backgroundColor: "#2b2e80",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  copyBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
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
    paddingVertical: 5,
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
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
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
    paddingVertical: 14,
    alignItems: "center",
  },
  fillText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

export default ElectricitySuccess;
