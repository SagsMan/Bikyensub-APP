import Header from "@/app/components/header";
import TransactionDetailModal from "@/app/components/TransactionDetailModal";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🔹 Define the transaction type
type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  negative: boolean;
  fullReceipt?: any;
  [key: string]: any;
};

const Transactions = () => {
  const { isDark, colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchTransactions = async () => {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) return;

    try {
      const response = await fetch(
       endPoints.getTransactions,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: userToken }),
        },
      );

      const data = await response.json(); // <-- `data` is defined here

      if (!data || !data.success) {
        Alert.alert("Error", data?.message || "Failed to fetch transactions");
        return;
      }

      // Map and format transactions for display
      const formatted: Transaction[] = data.transactions.map(
        (trx: any, index: number) => ({
          ...trx, // Spread everything from API (token, etc.)
          id: trx.id.toString(),
          title: trx.title,
          subtitle: trx.subtitle,
          amount: trx.amount,
          negative: trx.negative,
          status: trx.status,
          phone: trx.phone,
          date: trx.date,
          fullReceipt: trx.fullReceipt,
        }),
      );

      setTransactions(formatted);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      Alert.alert("Error", "Network or server error");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, []),
  );
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
          <Header title="Transaction History"/>
          <View style={styles.content}>
            <View
              style={[
                styles.transactionsCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {transactions.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedTrx(item);
                    setIsModalVisible(true);
                  }}
                  style={[
                    styles.transactionRow,
                    index !== 0 && [
                      styles.transactionRowBorder,
                      { borderTopColor: colors.border },
                    ],
                  ]}
                >
                  <View>
                    <Text
                      style={[styles.transactionTitle, { color: colors.text }]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.transactionSubtitle}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      item.subtitle?.toLowerCase().includes("successfully")
                        ? styles.amountPositive
                        : styles.amountNegative,
                    ]}
                  >
                    {item.amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TransactionDetailModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        transaction={selectedTrx}
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
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 70,
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
  transactionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e9ff",
    overflow: "hidden",
  },
  transactionRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#eef2ff",
  },
  transactionTitle: {
    color: "#1a1f36",
    fontSize: 13,
    fontWeight: "600",
  },
  transactionSubtitle: {
    color: "#8a94a6",
    fontSize: 11,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
  amountNegative: {
    color: "#d14343",
  },
  amountPositive: {
    color: "#20a85b",
  },
});

export default Transactions;
