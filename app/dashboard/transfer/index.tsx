import GradientButton from "@/app/components/buttons";
import Header from "@/app/components/header";
import UserCard from "@/app/components/user-card";
import { useTheme } from "@/context/ThemeContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TransferMoneyScreen() {
  const { user, balance } = useLocalSearchParams();

  const username = Array.isArray(user) ? user[0] : user;

  const { isDark, colors } = useTheme();

  // FORM STATE
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  // QUICK AMOUNT STATE
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<string | null>(
    null,
  );

  // QUICK AMOUNTS
  const quickAmounts = useMemo(
    () => [
      { label: "5k", value: "5000" },
      { label: "10k", value: "10000" },
      { label: "20k", value: "20000" },
      { label: "50k", value: "50000" },
    ],
    [],
  );

  // API DATA EXAMPLE
  const banks = [
    { id: "1", name: "Access Bank", code: "044" },
    { id: "2", name: "GTBank", code: "058" },
    { id: "3", name: "UBA", code: "033" },
    { id: "4", name: "First Bank", code: "011" },
    { id: "5", name: "Opay", code: "999992" },
  ];

  // HANDLE QUICK SELECT
  const handleQuickAmount = (label: string, value: string) => {
    setSelectedQuickAmount(label);
    setAmount(value);
  };

  // HANDLE MANUAL INPUT
  const handleAmountChange = (value: string) => {
    // allow only numbers
    const cleaned = value.replace(/[^0-9]/g, "");

    setAmount(cleaned);

    // remove chip selection if user types manually
    const matchedChip = quickAmounts.find((item) => item.value === cleaned);

    setSelectedQuickAmount(matchedChip?.label || null);
  };

  // HANDLE TRANSFER
  const handleTransfer = () => {
    if (!recipient || !amount) {
      Alert.alert("Missing fields", "Please fill all required fields");
      return;
    }

    const payload = {
      recipient,
      amount,
      note,
    };

    console.log("TRANSFER DATA:", payload);

    Alert.alert(
      "Transfer Initiated",
      `₦${Number(amount).toLocaleString()} sent to ${recipient}`,
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <Header title="Tranfer" />

          {/* USER CARD */}
          <UserCard
            username={username}
            colors={colors}
            balance={Number(balance || 0)}
          />

          {/* RECIPIENT */}
          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Recipient
            </Text>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                placeholder="Enter account number"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={recipient}
                onChangeText={setRecipient}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
              />
            </View>
          </View>
          {/* BANK SELECT */}
          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Bank
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setBankModalVisible(true)}
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  justifyContent: "space-between",
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={colors.textMuted}
                />

                <Text
                  style={{
                    marginLeft: 12,
                    color: selectedBank ? colors.text : colors.textMuted,
                    fontSize: 16,
                  }}
                >
                  {selectedBank ? selectedBank.name : "Select Bank"}
                </Text>
              </View>

              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* AMOUNT */}
          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Amount
            </Text>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                ₦
              </Text>

              <TextInput
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "600",
                  },
                ]}
              />
            </View>
          </View>

          {/* QUICK AMOUNTS */}
          <View style={styles.quickRow}>
            {quickAmounts.map((item) => {
              const isSelected = selectedQuickAmount === item.label;

              return (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.8}
                  onPress={() => handleQuickAmount(item.label, item.value)}
                  style={[
                    styles.quickBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.inputBorder,
                    },
                    isSelected && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickText,
                      {
                        color: isSelected ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    ₦{item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* NOTE */}
          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Note
            </Text>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Feather name="edit-3" size={18} color={colors.textMuted} />

              <TextInput
                placeholder="Add a short note"
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
              />
            </View>
          </View>

          {/* TRANSFER DETAILS */}
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Transfer Fee
              </Text>

              <Text
                style={[
                  styles.detailValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                ₦10.00
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Processing Time
              </Text>

              <Text
                style={[
                  styles.detailValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Instant
              </Text>
            </View>
          </View>

          {/* CTA */}
          <GradientButton title={`Transfer `} onPress={handleTransfer} />
        </ScrollView>
        {/* BANK MODAL */}
        <Modal visible={bankModalVisible} animationType="slide" transparent>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                maxHeight: "80%",
              }}
            >
              {/* HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                >
                  Select Bank
                </Text>

                <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* SEARCH */}
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.inputBorder,
                    marginBottom: 16,
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={colors.textMuted}
                />

                <TextInput
                  placeholder="Search bank..."
                  placeholderTextColor={colors.textMuted}
                  value={bankSearch}
                  onChangeText={setBankSearch}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                    },
                  ]}
                />
              </View>

              {/* BANK LIST */}
              <FlatList
                data={banks.filter((bank) =>
                  bank.name.toLowerCase().includes(bankSearch.toLowerCase()),
                )}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedBank?.id === item.id;

                  return (
                    <Pressable
                      onPress={() => {
                        setSelectedBank(item);
                        setBankModalVisible(false);
                      }}
                      style={{
                        paddingVertical: 16,
                        paddingHorizontal: 14,
                        borderRadius: 16,
                        marginBottom: 10,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surface,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? "#fff" : colors.text,
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  header: {
    marginTop: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  section: {
    marginTop: 18,
  },

  label: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "600",
  },

  inputContainer: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },

  quickRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  quickBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 72,
    alignItems: "center",
  },

  quickText: {
    fontWeight: "700",
    fontSize: 14,
  },

  detailsCard: {
    marginTop: 28,
    borderRadius: 22,
    padding: 20,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  detailLabel: {
    fontSize: 15,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: "700",
  },
});
