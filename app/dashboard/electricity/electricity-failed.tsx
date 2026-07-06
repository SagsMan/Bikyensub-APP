import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

const FailedIcon = require("@/assets/images/icon.png");

const ElectricityFailed = () => {
  const { isDark, colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topSection}>
          <Image source={FailedIcon} style={styles.failImage} />
          <Text style={[styles.failTitle, { color: colors.text }]}>
            Transaction Failed
          </Text>
          <Text style={[styles.failSubtitle, { color: colors.textMuted }]}>
            Please Try again later
          </Text>
        </View>

        <View style={styles.bottomSection}>
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
  failImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  failTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2b2e80",
    marginBottom: 6,
  },
  failSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  bottomSection: {
    paddingBottom: 10,
  },
  fillButton: {
    width: "100%",
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

export default ElectricityFailed;
