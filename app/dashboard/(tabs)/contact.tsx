import Header from "@/app/components/header";
import { APPEMAIL } from "@/constants/variables";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Contact = () => {
  const { isDark, colors } = useTheme();
  const openWhatsApp = () => {
    // Add your phone number here.
    // IMPORTANT: Use the international format without any +, leading zeros, brackets, or dashes.
    // Example for US number: '15551234567'
    const phoneNumber = "+2348160327173";
    const message = "Hello! rahausub Agents, I have a question."; // Optional pre-filled message

    // You can use either the whatsapp:// scheme or the universal link.
    // The universal link (https://wa.me/...) is often safer as it gracefully falls back to the browser if the app fails.
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        return Linking.openURL(url);
      })
      .catch((err) => console.error("An error occurred", err));
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
          <Header title="Contact Us" />

          <View style={styles.content}>
            <View
              style={[
                styles.heroCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.heroIconWrap,
                  {
                    backgroundColor: isDark
                      ? "rgba(37, 211, 102, 0.15)"
                      : "#e8fff0",
                  },
                ]}
              >
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Chat with us on WhatsApp
              </Text>
              <Text style={[styles.heroText, { color: colors.textMuted }]}>
                Need quick help? Our support team is available to assist you
                with airtime, data, electricity bills, and subscriptions. Tap
                below to start a WhatsApp conversation.
              </Text>
              <TouchableOpacity
                onPress={openWhatsApp}
                style={styles.ctaButton}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaText}>Contact Us on WhatsApp</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Support Hours
              </Text>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Monday - Saturday, 8:00am - 10:00pm
              </Text>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Sunday, 8:00am - 5:00pm
              </Text>
            </View>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Other Channels
              </Text>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Email: {APPEMAIL}
              </Text>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Phone: 0816 032 7173
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 24,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dce8ff",
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1f36",
    marginBottom: 8,
  },
  heroText: {
    fontSize: 13,
    color: "#5f6b7a",
    lineHeight: 18,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  infoCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e9ff",
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1f36",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
});

export default Contact;
