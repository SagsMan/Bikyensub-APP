import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Clipboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Modal from "react-native-modal";

interface TransactionDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  transaction: any | null;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isVisible,
  onClose,
  transaction,
}) => {
  const { isDark, colors } = useTheme();

  if (!transaction) return null;

  const receipt = transaction.fullReceipt || {};

  // 1. Clean and identify the token (remove non-digits)
  const rawToken =
    transaction.token ||
    receipt.token ||
    receipt.Purchased_Code ||
    receipt.purchased_code ||
    "";
  const cleanToken = String(rawToken).replace(/\D/g, "");

  // 2. Identify essential details for display (whitelist approach)
  const whitelist = [
    "meter_number",
    "meterNumber",
    "customer_name",
    "customerName",
    "address",
    "distributor",
    "meter_type",
    "meterType",
    "network",
    "plan",
    "data_plan",
    "type",
  ];

  const details: Record<string, any> = { ...receipt };
  // Add top-level fields to details if they are in whitelist
  whitelist.forEach((field) => {
    if (transaction[field] && details[field] === undefined) {
      details[field] = transaction[field];
    }
  });

  // Filter entries to only show whitelisted items and exclude duplicates
  const entries = Object.entries(details).filter(([key, val]) => {
    const isWhitelisted = whitelist.some(
      (w) => w.toLowerCase() === key.toLowerCase(),
    );
    const isDuplicateToken =
      key.toLowerCase() === "token" || key.toLowerCase() === "purchased_code";
    return (
      isWhitelisted &&
      !isDuplicateToken &&
      val !== null &&
      val !== undefined &&
      val !== ""
    );
  });

  const status = transaction.status || receipt.status || "Completed";
  const isSuccess =
    transaction.subtitle?.toLowerCase().includes("successfully") ||
    transaction.status?.toLowerCase() === "success";
  const statusColor = isSuccess ? "#20a85b" : "#d14343";
  const isFailed = !isSuccess;

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    // Alert.alert("Copied", `${label} has been copied to your clipboard.`);
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerIndicator} />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.receiptHeader}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isFailed ? "#fff1f1" : "#f0fff4" },
              ]}
            >
              <Ionicons
                name={
                  isFailed
                    ? "close-circle"
                    : transaction.negative
                      ? "arrow-up-circle"
                      : "arrow-down-circle"
                }
                size={40}
                color={isFailed ? "#d14343" : "#20a85b"}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {transaction.title}
            </Text>
            <Text
              style={[
                styles.amount,
                { color: isFailed ? "#d14343" : "#20a85b" },
              ]}
            >
              {transaction.amount}
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>
              {status}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {cleanToken ? (
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
                ELECTRICITY TOKEN
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text
                  style={[
                    styles.tokenValue,
                    { color: colors.primary, marginBottom: 0 },
                  ]}
                >
                  {cleanToken}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(cleanToken, "Token")}
                >
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, { marginTop: 15 }]}
                onPress={() => copyToClipboard(cleanToken, "Token")}
              >
                <Ionicons name="copy-outline" size={14} color="#ffffff" />
                <Text style={styles.copyBtnText}>Copy Token</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.detailsContainer}>
            {transaction.date && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                  DATE
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {transaction.date}
                </Text>
              </View>
            )}
            {transaction.phone && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                  PHONE NUMBER
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {transaction.phone}
                </Text>
              </View>
            )}

            {entries.length > 0
              ? entries.map(([key, value]: [string, any], index) => (
                  <View key={key} style={styles.detailRow}>
                    <Text
                      style={[styles.detailLabel, { color: colors.textMuted }]}
                    >
                      {key
                        .replace(/_/g, " ")
                        .replace(/([A-Z])/g, " $1")
                        .trim()
                        .toUpperCase()}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onLongPress={() =>
                        copyToClipboard(String(value), key.replace(/_/g, " "))
                      }
                      style={{ flex: 2 }}
                    >
                      <Text
                        style={[styles.detailValue, { color: colors.text }]}
                      >
                        {String(value)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              : !cleanToken && (
                  <View style={styles.detailRow}>
                    <Text
                      style={[styles.detailLabel, { color: colors.textMuted }]}
                    >
                      DETAILS
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {transaction.subtitle}
                    </Text>
                  </View>
                )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                TRANSACTION ID
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                #{transaction.id}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: "80%",
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
  },
  headerIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginBottom: 8,
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  receiptHeader: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  iconBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    flex: 2,
  },
  doneButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  tokenCard: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  copyBtn: {
    backgroundColor: "#2b2e80",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  copyBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default TransactionDetailModal;
