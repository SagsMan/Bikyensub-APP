import AlertModal from "@/app/components/AlertModal";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import SignatureScreen from "react-native-signature-canvas";

const BusinessNameRegistration = () => {
  const { isDark, colors } = useTheme();

  // Form State
  const [sname, setSname] = useState("");
  const [proprietorPhone, setProprietorPhone] = useState("");
  const [proprietorEmail, setProprietorEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [natureOfBusiness, setNatureOfBusiness] = useState("");
  const [proposedName1, setProposedName1] = useState("");
  const [proposedName2, setProposedName2] = useState("");
  const [proprietorAddress, setProprietorAddress] = useState("");

  // Images State
  const [passport, setPassport] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [ninImage, setNinImage] = useState<any>(null);

  // UI State
  const [isSignatureModalVisible, setSignatureModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const signatureRef = useRef<any>(null);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const pickImage = async (type: "passport" | "nin") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === "passport") setPassport(result.assets[0]);
      else setNinImage(result.assets[0]);
    }
  };

  const handleSignature = (signatureData: string) => {
    setSignature(signatureData);
    setSignatureModalVisible(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleSave = () => {
    signatureRef.current?.readSignature();
  };

  const handleSubmit = async () => {
    // Basic Validation
    if (
      !sname ||
      !proprietorPhone ||
      !proprietorEmail ||
      !businessAddress ||
      !natureOfBusiness ||
      !proposedName1 ||
      !proposedName2 ||
      !proprietorAddress
    ) {
      showAlert("Validation Error", "Please fill in all text fields.");
      return;
    }

    if (!passport || !signature || !ninImage) {
      showAlert(
        "Validation Error",
        "Please upload all required images and signature.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        showAlert("Error", "User not authenticated.");
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("token", userToken);
      formData.append("sname", sname);
      formData.append("proprietor_phone", proprietorPhone);
      formData.append("proprietor_email", proprietorEmail);
      formData.append("business_address", businessAddress);
      formData.append("nature_of_business", natureOfBusiness);
      formData.append("proposed_name_1", proposedName1);
      formData.append("proposed_name_2", proposedName2);
      formData.append("proprietor_address", proprietorAddress);

      // Append Passport
      const passportUri = passport.uri;
      const passportName = passportUri.split("/").pop();
      const passportType = "image/jpeg"; // Defaulting to jpeg
      // @ts-ignore
      formData.append("proprietor_passport", {
        uri:
          Platform.OS === "android"
            ? passportUri
            : passportUri.replace("file://", ""),
        name: passportName,
        type: passportType,
      });

      // Append NIN
      const ninUri = ninImage.uri;
      const ninName = ninUri.split("/").pop();
      const ninType = "image/jpeg";
      // @ts-ignore
      formData.append("nin", {
        uri: Platform.OS === "android" ? ninUri : ninUri.replace("file://", ""),
        name: ninName,
        type: ninType,
      });

      // Append Signature (it's base64 from the canvas)
      // Save it to a local file first
      const signatureFilename = "signature.png";
      const signaturePath = FileSystem.cacheDirectory + signatureFilename;
      const base64Code = signature.split("data:image/png;base64,")[1];
      await FileSystem.writeAsStringAsync(signaturePath, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // @ts-ignore
      formData.append("proprietor_signature", {
        uri: signaturePath,
        name: signatureFilename,
        type: "image/png",
      });

      const response = await fetch(
        endPoints.registerCAC,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const responseData = await response.json();

      if (responseData.success) {
        router.replace({
          pathname: "/dashboard/cac/cac-success",
          params: {
            sname: sname,
            businessName: proposedName1,
            amount: "19000",
          },
        });
      } else {
        showAlert(
          "Error",
          responseData.message || "Failed to submit registration.",
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      showAlert("Error", "A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.headerLink}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Business Name Registration</Text>
            <TouchableOpacity>
              <Text style={styles.headerLink}>Help</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            <View
              style={[
                styles.noteBubble,
                {
                  backgroundColor: isDark ? "#3d1b1b" : "#ffe2e2",
                  borderColor: isDark ? "#b00020" : "#f0a4a4",
                },
              ]}
            >
              <Text
                style={[
                  styles.noteTitle,
                  { color: isDark ? "#ff5252" : "#b00020" },
                ]}
              >
                Note!
              </Text>
              <Text
                style={[
                  styles.noteText,
                  { color: isDark ? "#ffcdd2" : "#4a1f1f" },
                ]}
              >
                This Business Name Registration will cost you{" "}
                <Text
                  style={[
                    styles.noteAmount,
                    { color: isDark ? "#ff5252" : "#b00020" },
                  ]}
                >
                  N19000
                </Text>
              </Text>
              <View
                style={[
                  styles.noteTail,
                  {
                    backgroundColor: isDark ? "#3d1b1b" : "#ffe2e2",
                    borderColor: isDark ? "#b00020" : "#f0a4a4",
                  },
                ]}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Business Information
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Surname (Person Registering)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={sname}
              onChangeText={setSname}
              placeholder="Enter surname"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Proposed Name Option 1
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={proposedName1}
              onChangeText={setProposedName1}
              placeholder="First choice business name"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Proposed Name Option 2
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={proposedName2}
              onChangeText={setProposedName2}
              placeholder="Second choice business name"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Nature of Business
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={natureOfBusiness}
              onChangeText={setNatureOfBusiness}
              placeholder="e.g. IT Services, Trading, etc"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Business Address
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={businessAddress}
              onChangeText={setBusinessAddress}
              placeholder="Full office address"
            />

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 10 },
              ]}
            >
              Proprietor Details
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Proprietor Address
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={proprietorAddress}
              onChangeText={setProprietorAddress}
              placeholder="Residential address"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Proprietor Phone Number
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={proprietorPhone}
              onChangeText={setProprietorPhone}
              placeholder="080XXXXXXXX"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Proprietor Email
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              value={proprietorEmail}
              onChangeText={setProprietorEmail}
              placeholder="example@mail.com"
            />

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 10 },
              ]}
            >
              Uploads & Signature
            </Text>

            <View style={styles.uploadRow}>
              <TouchableOpacity
                style={[
                  styles.uploadBox,
                  {
                    backgroundColor: isDark ? colors.surface : "#f8faff",
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => pickImage("passport")}
              >
                {passport ? (
                  <Image
                    source={{ uri: passport.uri }}
                    style={styles.previewImage}
                  />
                ) : (
                  <>
                    <Text
                      style={[styles.uploadLabelText, { color: colors.text }]}
                    >
                      Passport
                    </Text>
                    <Text
                      style={[
                        styles.uploadSubText,
                        { color: colors.textMuted },
                      ]}
                    >
                      Tap to pick
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.uploadBox,
                  {
                    backgroundColor: isDark ? colors.surface : "#f8faff",
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => pickImage("nin")}
              >
                {ninImage ? (
                  <Image
                    source={{ uri: ninImage.uri }}
                    style={styles.previewImage}
                  />
                ) : (
                  <>
                    <Text
                      style={[styles.uploadLabelText, { color: colors.text }]}
                    >
                      NIN Card
                    </Text>
                    <Text
                      style={[
                        styles.uploadSubText,
                        { color: colors.textMuted },
                      ]}
                    >
                      Tap to pick
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.signatureBox,
                {
                  backgroundColor: isDark ? colors.surface : "#f8faff",
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSignatureModalVisible(true)}
            >
              {signature ? (
                <Image
                  source={{ uri: signature }}
                  style={styles.previewSignature}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Text
                    style={[styles.uploadLabelText, { color: colors.text }]}
                  >
                    Owner's Signature
                  </Text>
                  <Text
                    style={[styles.uploadSubText, { color: colors.textMuted }]}
                  >
                    Tap to draw signature (Blue Color)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.continueButton, isLoading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.continueText}>Submit Registration</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        isVisible={isSignatureModalVisible}
        onBackdropPress={() => setSignatureModalVisible(false)}
        style={styles.sigModal}
      >
        <View
          style={[styles.sigContainer, { backgroundColor: colors.background }]}
        >
          <View style={styles.sigHeader}>
            <Text style={[styles.sigTitle, { color: colors.text }]}>
              Draw Signature (Blue Color)
            </Text>
            <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
              <Text style={{ color: "#d14343", fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 200, width: "100%" }}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => showAlert("Empty", "Please draw your signature.")}
              descriptionText="Sign here in Blue"
              penColor="blue"
              webStyle={`
                .m-signature-pad--footer { display: none; }
                .m-signature-pad { background-color: #fff; border: 1px solid #e8e8e8; box-shadow: none; border-radius: 8px; }
                .m-signature-pad--body { border: none; }
              `}
            />
          </View>
          <View style={styles.sigFooter}>
            <TouchableOpacity
              style={[
                styles.sigButton,
                { backgroundColor: isDark ? colors.surface : "#f1f2ff" },
              ]}
              onPress={handleClear}
            >
              <Text style={[styles.sigButtonText, { color: "#2b2e80" }]}>
                Clear
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sigButton, { backgroundColor: "#2b2e80" }]}
              onPress={handleSave}
            >
              <Text style={[styles.sigButtonText, { color: "#fff" }]}>
                Save Signature
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AlertModal
        isVisible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
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
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  noteBubble: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    position: "relative",
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b00020",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: "#4a1f1f",
  },
  noteAmount: {
    fontWeight: "700",
    color: "#b00020",
  },
  noteTail: {
    position: "absolute",
    right: 24,
    bottom: -6,
    width: 14,
    height: 14,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: "45deg" }],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1f36",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: "#1a1f36",
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  uploadRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  uploadBox: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  signatureBox: {
    height: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 20,
    overflow: "hidden",
  },
  uploadLabelText: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  uploadSubText: {
    fontSize: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewSignature: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },
  continueButton: {
    marginTop: 10,
  },
  continueGradient: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  sigModal: {
    margin: 20,
    justifyContent: "center",
  },
  sigContainer: {
    height: 400,
    borderRadius: 24,
    padding: 20,
  },
  sigHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sigTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sigFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  sigButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sigButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export default BusinessNameRegistration;
