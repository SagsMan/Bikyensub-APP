import GradientButton from "@/app/components/buttons";
import Header from "@/app/components/header";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import React, { useState } from "react";
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

export default function NINVerify() {
  const { isDark, colors } = useTheme();

  // FORM STATE
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const [selectedSlipType, setSelectedSlipType] = useState<any>(null);
  const [slipTypeModalVisible, setSlipTypeModalVisible] = useState(false);
  const [slipTypeSearch, setslipTypeSearch] = useState("");

  const [selectedMeansOfId, setSelectedMeansOfId] = useState<any>(null);
  const [meansOfIdModalVisible, setmeansOfIdModalVisible] = useState(false);
  const [meansOfIdSearch, setmeansOfIdSearch] = useState("");

  const [isChecked, setChecked] = useState<boolean>(false);

  const slipTypes = [
    { id: "1", name: "NIN Regular" },
    { id: "2", name: "Improved NIN Slip" },
    { id: "3", name: "Premium NIN Slip" },
    { id: "4", name: "Basic Verification Slip" },
  ];

  const meansOfId = [
    { id: "1", name: " BY NIN" },
    { id: "2", name: "BY PHONE NUMBER" },
  ];

  const [modalData, setModalData] = useState<
    typeof slipTypes | typeof meansOfId
  >(slipTypes);

  // HANDLE MANUAL INPUT
  const handleAmountChange = (value: string) => {
    // allow only numbers
    const cleaned = value.replace(/[^0-9]/g, "");

    setAmount(cleaned);
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
           <Header title="Verify NIN"/>

          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Slip Type
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSlipTypeModalVisible(true);
                setModalData(slipTypes);
              }}
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
                <Text
                  style={{
                    marginLeft: 12,
                    color: selectedSlipType ? colors.text : colors.textMuted,
                    fontSize: 16,
                  }}
                >
                  {selectedSlipType
                    ? selectedSlipType.name
                    : "Select Slip Type"}
                </Text>
              </View>

              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Means of ID
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setmeansOfIdModalVisible(true);
                setModalData(meansOfId);
              }}
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
                <Text
                  style={{
                    marginLeft: 12,
                    color: selectedMeansOfId ? colors.text : colors.textMuted,
                    fontSize: 16,
                  }}
                >
                  {selectedMeansOfId
                    ? selectedMeansOfId.name
                    : "Select Means of ID"}
                </Text>
              </View>

              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              ID Number
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
              <TextInput
                placeholder="Enter NIN Number"
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
              Charges
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

          <View
            style={[
              styles.section,
              {
                display: "flex",
                flexDirection: "row",
                gap: 15,
                alignItems: "center",
              },
            ]}
          >
            <Checkbox
              value={isChecked}
              onValueChange={setChecked}
              color={isChecked ? "#4630EB" : undefined}
            />
            <Text>
              I acknoledge that I have gotten consent from the data subject
            </Text>
          </View>

          {/* CTA */}
          <GradientButton title="Verify" onPress={handleTransfer} />
        </ScrollView>

        <Modal
          visible={slipTypeModalVisible || meansOfIdModalVisible}
          animationType="slide"
          transparent
        >
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
                  {`Select ${meansOfIdModalVisible ? "Means of ID" : "Slip Type"} `}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setSlipTypeModalVisible(false);
                    setmeansOfIdModalVisible(false);
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {slipTypeModalVisible && (
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
                    placeholder="Search Slip Type..."
                    placeholderTextColor={colors.textMuted}
                    value={
                      slipTypeModalVisible ? slipTypeSearch : meansOfIdSearch
                    }
                    onChangeText={
                      slipTypeModalVisible
                        ? setslipTypeSearch
                        : setmeansOfIdSearch
                    }
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                      },
                    ]}
                  />
                </View>
              )}

              {/* BANK LIST */}
              <FlatList
                data={modalData.filter((type) =>
                  type.name
                    .toLowerCase()
                    .includes(slipTypeSearch.toLowerCase()),
                )}
                style={{ marginBottom: 40 }}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedSlipType?.id === item.id;

                  return (
                    <Pressable
                      onPress={() => {
                        if (slipTypeModalVisible) {
                          setSelectedSlipType(item);
                          setSlipTypeModalVisible(false);
                        } else {
                          setSelectedMeansOfId(item);
                          setmeansOfIdModalVisible(false);
                        }
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
