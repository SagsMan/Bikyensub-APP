import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TransactionDetailModal from "../../components/TransactionDetailModal";

// 🔹 Define the transaction type
type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  negative: boolean;
  fullReceipt?: any;
};

import * as Haptics from "expo-haptics";

import { services } from "@/constants/features";
import { AppLogo, CardBg } from "@/constants/images";
import { styles } from "@/constants/styles";
import { User } from "@/constants/types";
import * as Notifications from "expo-notifications";
import { useTheme } from "../../../context/ThemeContext";
import UserCard from "../../components/user-card";
import { endPoints } from "@/constants/urls";
import { APPNAME } from "@/constants/variables";

const Dashboard = () => {
  const { isDark, colors } = useTheme();
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

  const not = async () => {
    await sendNotification(
      `Welcome back to ${APPNAME}`,
      `Get 1 GB as low as ₦250`,
    );
  };

  useEffect(() => {
    not();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const triggerVibration = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    triggerVibration();
  }, []);

  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");

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

      // Map and format transactions for display, limit to 3
      const formatted: Transaction[] = data.transactions
        .slice(0, 4) // take only first 3 items
        .map((trx: any, index: number) => ({
          id: trx.id.toString(),
          title: trx.title,
          subtitle: trx.subtitle,
          amount: trx.amount,
          negative: trx.negative,
          status: trx.status, // include status from API
          phone: trx.phone, // capture phone
          date: trx.date, // capture date
          fullReceipt: trx.fullReceipt, // optional full receipt
        }));

      setTransactions(formatted);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      Alert.alert("Error", "Network or server error");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    getBalance();
    getAccountDetails();
  }, []);

  //Get Account Details Function
  const getAccountDetails = async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userToken) return;

      const response = await fetch(
        endPoints.getAccountDetails,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: userToken }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setAccountNumber(data.account_number);
        setBankName(data.bank_name);
        setAccountName(data.account_name);
      } else {
        console.log("Account Error:", data.message);
      }
    } catch (error) {
      console.error("Account fetch error:", error);
    }
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

      const response = await fetch(
        endPoints.getBalance,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: userToken }),
        },
      );

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

  // 🚀 Load balance on screen open
  useEffect(() => {
    getBalance();
  }, []);

  // 🔄 Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getBalance(true);
    fetchTransactions();
  }, []);

  // 👤 Load user from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.log("User parse error:", e);
      }
    };

    loadUser();
  }, []);

  // 🔐 Redirect if no PIN
  useEffect(() => {
    if (user?.haspin === false) {
      router.replace("/dashboard/set-pin");
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      getBalance(true);
    }, []),
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { marginTop: -25, backgroundColor: colors.background },
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View
            style={{
              paddingTop: 72,
              paddingBottom: 120,
              paddingHorizontal: 20,
              borderBottomRightRadius: 20,
              borderBottomLeftRadius: 20,
            }}
          >
            <UserCard username={user?.name} colors={colors} balance={balance} />
          </View>

          <ImageBackground
            source={CardBg}
            style={styles.bankCard}
            imageStyle={styles.bankCardImage}
          >
            <View
              style={[
                styles.bankCardOverlay,
                {
                  backgroundColor: isDark
                    ? "rgba(15, 23, 42, 0.82)"
                    : "rgba(255, 255, 255, 0.85)",
                },
              ]}
            >
              <View style={styles.bankRowTop}>
                <View>
                  <Text style={[styles.bankTitle, { color: colors.text }]}>
                    Bank Details
                  </Text>
                  <Text style={[styles.bankSub, { color: colors.textMuted }]}>
                    To fund your wallet automatically
                  </Text>
                  <Text style={[styles.bankSub, { color: colors.textMuted }]}>
                    Kindly make a bank transfer to this account
                  </Text>
                </View>
                <View
                  style={[
                    styles.fundButton,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.fundButtonText,
                      { color: isDark ? "#000000" : "#ffffff" },
                    ]}
                  >
                    Fund Wallet
                  </Text>
                </View>
              </View>

              <View style={styles.bankInfoGroup}>
                <Text style={[styles.bankLabel, { color: colors.textMuted }]}>
                  Account Number
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={[styles.bankValue, { color: colors.text }]}>
                    {accountNumber || (
                      <ActivityIndicator size="small" color={colors.accent} />
                    )}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.fundButton,
                      {
                        backgroundColor: colors.accent,
                        marginLeft: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      },
                    ]}
                    onPress={() => {
                      // Copy to clipboard
                      Clipboard.setString(accountNumber || "");
                    }}
                  >
                    <Text
                      style={[
                        styles.fundButtonText,
                        { fontSize: 12, color: isDark ? "#000000" : "#ffffff" },
                      ]}
                    >
                      copy{" "}
                      <Ionicons
                        name="copy-outline"
                        size={12}
                        color={isDark ? "#000000" : "#ffffff"}
                      />
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.bankInfoGroup}>
                <Text style={[styles.bankLabel, { color: colors.textMuted }]}>
                  Bank name
                </Text>
                <Text style={[styles.bankValue, { color: colors.text }]}>
                  {bankName || (
                    <ActivityIndicator size="small" color={colors.accent} />
                  )}
                </Text>
              </View>

              <View style={styles.bankFooter}>
                <Text style={[styles.bankOwner, { color: colors.text }]}>
                  {accountName || (
                    <ActivityIndicator size="small" color={colors.accent} />
                  )}
                </Text>
                <View
                  style={[
                    styles.bankBadge,
                    { backgroundColor: isDark ? colors.surface : "#ffffff" },
                  ]}
                >
                  <Image source={AppLogo} style={styles.bankBadgeIcon} />
                </View>
              </View>
            </View>
          </ImageBackground>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Our Services
          </Text>

          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                activeOpacity={0.75}
                key={service.id}
                style={styles.serviceCard}
                onPress={() => {
                  if (service.id === "airtime") {
                    router.push("/dashboard/airtime");
                  }
                  if (service.id === "data") {
                    router.push("/dashboard/data");
                  }
                  if (service.id === "electricity") {
                    router.push("/dashboard/electricity");
                  }
                  if (service.id === "tv") {
                    router.push("/dashboard/tv");
                  }
                  if (service.id === "exams") {
                    router.push("/dashboard/exam");
                  }
                  if (service.id === "cac") {
                    router.push("/dashboard/cac");
                  }
                  if (service.id === "more") {
                    router.push("/dashboard/verify");
                  }
                  if (service.id === "transfer") {
                    router.push({
                      pathname: "/dashboard/transfer",
                      params: { user: user?.name, balance: balance },
                    });
                  }
                }}
              >
                <View
                  style={[
                    styles.serviceIconWrap,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image source={service.icon} style={styles.serviceIcon} />
                </View>
                <Text style={[styles.serviceLabel, { color: colors.text }]}>
                  {service.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>
          <View
            style={[
              styles.transactionsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {transactions.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.transactionRow,
                  index !== 0 && [
                    styles.transactionRowBorder,
                    { borderTopColor: colors.border },
                  ],
                ]}
                onPress={() => {
                  setSelectedTrx(item);
                  setIsModalVisible(true);
                }}
              >
                <View>
                  <Text
                    style={[styles.transactionTitle, { color: colors.text }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.transactionSubtitle,
                      { color: colors.textMuted },
                    ]}
                  >
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

export default Dashboard;
