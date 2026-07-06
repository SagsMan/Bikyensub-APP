import React, { useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Modal from "react-native-modal";

import { Ionicons } from "@expo/vector-icons";

import { AppLogo } from "@/constants/images";
import { styles } from "@/constants/styles";
import { endPoints } from "@/constants/urls";
import { router } from "expo-router";
import nigeria from "../assets/json/nigeria.json"; // adjust path
import { useTheme } from "../context/ThemeContext";
import AlertModal from "./components/AlertModal";
import GradientButton from "./components/buttons";

const Register = () => {
  const { isDark, colors } = useTheme();
  const [stateModalVisible, setStateModalVisible] = useState(false);

  const [selectedState, setSelectedState] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  type NigeriaState = {
    state: string;
    lgas: {
      name: string;
      wards: {
        name: string;
        latitude: number;
        longitude: number;
      }[];
    }[];
  };

  const states = (nigeria as NigeriaState[]).map((item) => ({
    label: item.state,
    value: item.state,
  }));

  const [isLoading, setisLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const handleRegister = async () => {
    // Check inputs before sending request
    if (
      fullName.length <= 4 ||
      email.length <= 4 ||
      phone.length <= 4 ||
      password.length <= 3 ||
      !selectedState
    ) {
      setAlertTitle("Validation Error");
      setAlertMessage(
        "All fields must be filled and longer than 4 characters and a state must be selected.",
      );
      setAlertVisible(true);
      return;
    }

    // Inputs are valid, start loading
    setisLoading(true);

    const data = {
      fullName: fullName,
      email: email,
      phone: phone,
      state: selectedState,
      password: password,
    };

    try {
      const response = await fetch(endPoints.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (json.success) {
        setisLoading(false);
        setAlertTitle("Success");
        setAlertMessage(json.message);
        setAlertVisible(true);
        router.push("/Login");
      } else {
        setisLoading(false);
        if (json.errors) {
          // const allErrors = Object.values(json.errors).flat().join('\n');
          setAlertTitle("Registration Failed");
          setAlertMessage(json.message);
          setAlertVisible(true);
        } else {
          setAlertTitle("Registration Failed");
          setAlertMessage(json.message);
          setAlertVisible(true);
        }
      }
    } catch (err) {
      setisLoading(false);
      console.log(err);
      setAlertTitle("Error");
      setAlertMessage("Something went wrong. Please try again.");
      setAlertVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, padding: 20, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 3 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: 40, marginBottom: 50 }}>
          <View style={[styles.LogoImg, { alignSelf: "center" }]}>
            <Image source={AppLogo} style={styles.LogoImgB} />
          </View>
          <Text
            style={{
              marginTop: 0,
              color: colors.text,
              fontSize: 27,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            Kindly provide the required info to create an account
          </Text>
        </View>

        {/* INPUT START */}
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 3,
            }}
          >
            Enter Full Name
          </Text>
          <TextInput
            onChangeText={setFullName}
            placeholderTextColor={colors.textMuted}
            style={{
              height: 50,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              justifyContent: "center",
              marginBottom: 20,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />
        </View>
        {/* INPUT END */}

        {/* INPUT START */}
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 3,
            }}
          >
            Enter Email Address
          </Text>
          <TextInput
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={colors.textMuted}
            style={{
              height: 50,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              justifyContent: "center",
              marginBottom: 20,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />
        </View>
        {/* INPUT END */}

        {/* INPUT START */}
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 3,
            }}
          >
            Enter Phone Number
          </Text>
          <TextInput
            onChangeText={setPhone}
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
            style={{
              height: 50,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              justifyContent: "center",
              marginBottom: 20,
              color: colors.text,
              backgroundColor: colors.surface,
            }}
          />
        </View>
        {/* INPUT END */}

        {/* INPUT START */}
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 3,
            }}
          >
            Select State of Residence
          </Text>

          <TouchableOpacity
            onPress={() => setStateModalVisible(true)}
            style={{
              height: 50,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              justifyContent: "center",
              marginBottom: 20,
              backgroundColor: colors.surface,
            }}
          >
            <Text
              style={{ color: selectedState ? colors.text : colors.textMuted }}
            >
              {selectedState || "Select a state"}
            </Text>
          </TouchableOpacity>
        </View>
        {/* INPUT END */}

        {/* INPUT START */}
        <View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginBottom: 2,
              marginLeft: 3,
            }}
          >
            Create Password
          </Text>

          <View
            style={{
              height: 50,
              borderColor: colors.inputBorder,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: colors.surface,
            }}
          >
            <TextInput
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, color: colors.text }}
            />

            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textMuted}
              onPress={() => setShowPassword(!showPassword)}
            />
          </View>
        </View>
        {/* INPUT END */}

        <Text
          style={{
            color: colors.textMuted,
            fontSize: 15,
            marginBottom: 5,
            marginLeft: 3,
          }}
        >
          By Signing up you agree to our terms and conditions
        </Text>

        <GradientButton
          title="Get Started"
          loading={isLoading}
          onPress={handleRegister}
        />

        <TouchableOpacity
          onPress={() => {
            router.push("/Login");
          }}
        >
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              marginTop: 10,
              marginBottom: 30,
              color: colors.text,
            }}
          >
            Already Have an Account?
          </Text>
        </TouchableOpacity>

        <Modal
          isVisible={stateModalVisible}
          onBackdropPress={() => setStateModalVisible(false)}
          style={{ justifyContent: "flex-end", margin: 0 }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "60%",
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 10,
                textAlign: "center",
                color: colors.text,
              }}
            >
              Select State
            </Text>

            <FlatList
              data={states}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedState(item.value);
                    setStateModalVisible(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.text }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>

        {/* Alert Modal */}
        <AlertModal
          isVisible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
