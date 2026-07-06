import { APPNAME } from "@/constants/variables";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SuccessIcon = require("@/assets/images/success.png");

const ExamsSuccess = () => {
  const { isDark, colors } = useTheme();
  const { exam, quantity, amount } = useLocalSearchParams<{
    exam?: string;
    quantity?: string;
    amount?: string;
  }>();

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
                Exam Type:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {exam || "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Quantity:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {quantity || "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Amount:
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {amount || "-"}
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

export default ExamsSuccess;
