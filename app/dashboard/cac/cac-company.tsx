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

const CompanyRegistration = () => {
  const { isDark, colors } = useTheme();

  // ── Company Info ──────────────────────────────────────
  const [proposedName1, setProposedName1] = useState("");
  const [proposedName2, setProposedName2] = useState("");
  const [classification, setClassification] = useState("");
  const [natureOfCompany, setNatureOfCompany] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // ── Proprietor 1 ─────────────────────────────────────
  const [p1Name, setP1Name] = useState("");
  const [p1Address, setP1Address] = useState("");
  const [p1Phone, setP1Phone] = useState("");
  const [p1Email, setP1Email] = useState("");
  const [p1Passport, setP1Passport] = useState<any>(null);
  const [p1Nin, setP1Nin] = useState<any>(null);
  const [p1Signature, setP1Signature] = useState<any>(null);

  // ── Proprietor 2 ─────────────────────────────────────
  const [p2Name, setP2Name] = useState("");
  const [p2Address, setP2Address] = useState("");
  const [p2Phone, setP2Phone] = useState("");
  const [p2Email, setP2Email] = useState("");
  const [p2Passport, setP2Passport] = useState<any>(null);
  const [p2Nin, setP2Nin] = useState<any>(null);
  const [p2Signature, setP2Signature] = useState<any>(null);

  // ── UI State ──────────────────────────────────────────
  const [activeSig, setActiveSig] = useState<1 | 2 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const sig1Ref = useRef<any>(null);
  const sig2Ref = useRef<any>(null);

  const activeRef = activeSig === 1 ? sig1Ref : sig2Ref;

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const pickImage = async (
    field: "p1passport" | "p1nin" | "p2passport" | "p2nin",
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (field === "p1passport") setP1Passport(asset);
    else if (field === "p1nin") setP1Nin(asset);
    else if (field === "p2passport") setP2Passport(asset);
    else setP2Nin(asset);
  };

  const handleSignatureSaved = (data: string) => {
    if (activeSig === 1) setP1Signature(data);
    else if (activeSig === 2) setP2Signature(data);
    setActiveSig(null);
  };

  const appendFile = (
    formData: FormData,
    key: string,
    asset: any,
    fallbackName: string,
  ) => {
    const uri = asset.uri;
    const name = uri.split("/").pop() ?? fallbackName;
    // @ts-ignore
    formData.append(key, {
      uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
      name,
      type: "image/jpeg",
    });
  };

  const appendSignature = async (
    formData: FormData,
    key: string,
    base64Data: string,
    filename: string,
  ) => {
    const path = FileSystem.cacheDirectory + filename;
    const code = base64Data.split("data:image/png;base64,")[1];
    await FileSystem.writeAsStringAsync(path, code, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // @ts-ignore
    formData.append(key, { uri: path, name: filename, type: "image/png" });
  };

  const handleSubmit = async () => {
    if (
      !proposedName1 ||
      !proposedName2 ||
      !classification ||
      !natureOfCompany ||
      !companyAddress ||
      !p1Name ||
      !p1Address ||
      !p1Phone ||
      !p1Email ||
      !p2Name ||
      !p2Address ||
      !p2Phone ||
      !p2Email
    ) {
      showAlert("Validation Error", "Please fill in all text fields.");
      return;
    }
    if (!p1Passport || !p1Nin || !p1Signature) {
      showAlert(
        "Validation Error",
        "Please complete Proprietor 1 uploads and signature.",
      );
      return;
    }
    if (!p2Passport || !p2Nin || !p2Signature) {
      showAlert(
        "Validation Error",
        "Please complete Proprietor 2 uploads and signature.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        showAlert("Error", "User not authenticated.");
        return;
      }

      const dateSubmitted = new Date().toISOString().split("T")[0];

      const formData = new FormData();
      formData.append("token", userToken);
      formData.append("proposed_name_1", proposedName1);
      formData.append("proposed_name_2", proposedName2);
      formData.append("classification", classification);
      formData.append("nature_of_company", natureOfCompany);
      formData.append("company_address", companyAddress);
      formData.append("proprietor_1_name", p1Name);
      formData.append("proprietor_1_address", p1Address);
      formData.append("proprietor_1_phone", p1Phone);
      formData.append("proprietor_1_email", p1Email);
      formData.append("proprietor_2_name", p2Name);
      formData.append("proprietor_2_address", p2Address);
      formData.append("proprietor_2_phone", p2Phone);
      formData.append("proprietor_2_email", p2Email);
      formData.append("date_submitted", dateSubmitted);

      appendFile(
        formData,
        "proprietor_1_passport",
        p1Passport,
        "p1_passport.jpg",
      );
      appendFile(formData, "proprietor_1_nin", p1Nin, "p1_nin.jpg");
      appendFile(
        formData,
        "proprietor_2_passport",
        p2Passport,
        "p2_passport.jpg",
      );
      appendFile(formData, "proprietor_2_nin", p2Nin, "p2_nin.jpg");

      await appendSignature(
        formData,
        "proprietor_1_signature",
        p1Signature,
        "sig1.png",
      );
      await appendSignature(
        formData,
        "proprietor_2_signature",
        p2Signature,
        "sig2.png",
      );

      const response = await fetch(
        endPoints.companyCAC,
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
            sname: p1Name,
            businessName: proposedName1,
            amount: "45000",
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

  // ─── Reusable upload row for a proprietor ────────────
  const ProprietorUploads = ({
    passport,
    nin,
    onPickPassport,
    onPickNin,
    sigValue,
    sigIndex,
  }: {
    passport: any;
    nin: any;
    onPickPassport: () => void;
    onPickNin: () => void;
    sigValue: any;
    sigIndex: 1 | 2;
  }) => (
    <>
      <View style={styles.uploadRow}>
        <TouchableOpacity
          style={[
            styles.uploadBox,
            {
              backgroundColor: isDark ? colors.surface : "#f8faff",
              borderColor: colors.border,
            },
          ]}
          onPress={onPickPassport}
        >
          {passport ? (
            <Image source={{ uri: passport.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={[styles.uploadLabelText, { color: colors.text }]}>
                Passport
              </Text>
              <Text style={[styles.uploadSubText, { color: colors.textMuted }]}>
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
          onPress={onPickNin}
        >
          {nin ? (
            <Image source={{ uri: nin.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Text style={[styles.uploadLabelText, { color: colors.text }]}>
                NIN Card
              </Text>
              <Text style={[styles.uploadSubText, { color: colors.textMuted }]}>
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
        onPress={() => setActiveSig(sigIndex)}
      >
        {sigValue ? (
          <Image
            source={{ uri: sigValue }}
            style={styles.previewSignature}
            resizeMode="contain"
          />
        ) : (
          <>
            <Text style={[styles.uploadLabelText, { color: colors.text }]}>
              Signature
            </Text>
            <Text style={[styles.uploadSubText, { color: colors.textMuted }]}>
              Tap to draw (Blue ink)
            </Text>
          </>
        )}
      </TouchableOpacity>
    </>
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
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.headerLink}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company Registration</Text>
            <TouchableOpacity>
              <Text style={styles.headerLink}>Help</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            {/* Note */}
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
                Company Registration will cost{" "}
                <Text
                  style={[
                    styles.noteAmount,
                    { color: isDark ? "#ff5252" : "#b00020" },
                  ]}
                >
                  ₦45,000
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

            {/* ── Company Information ── */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Company Information
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Proposed Company Name 1
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
              placeholder="First choice name"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Proposed Company Name 2
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
              placeholder="Second choice name"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Classification
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
              value={classification}
              onChangeText={setClassification}
              placeholder="e.g. Private Limited (Ltd)"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Nature of Company
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
              value={natureOfCompany}
              onChangeText={setNatureOfCompany}
              placeholder="e.g. Technology, Trading, etc."
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Company Address
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
              value={companyAddress}
              onChangeText={setCompanyAddress}
              placeholder="Full registered office address"
            />

            {/* ── Proprietor 1 ── */}
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 10 },
              ]}
            >
              Proprietor 1 Details
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Full Name
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
              value={p1Name}
              onChangeText={setP1Name}
              placeholder="Proprietor 1 full name"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Address
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
              value={p1Address}
              onChangeText={setP1Address}
              placeholder="Residential address"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Phone Number
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
              value={p1Phone}
              onChangeText={setP1Phone}
              placeholder="080XXXXXXXX"
              maxLength={11}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Email
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
              autoCapitalize="none"
              value={p1Email}
              onChangeText={setP1Email}
              placeholder="example@mail.com"
            />

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 6 },
              ]}
            >
              Proprietor 1 — Uploads & Signature
            </Text>
            <ProprietorUploads
              passport={p1Passport}
              nin={p1Nin}
              onPickPassport={() => pickImage("p1passport")}
              onPickNin={() => pickImage("p1nin")}
              sigValue={p1Signature}
              sigIndex={1}
            />

            {/* ── Proprietor 2 ── */}
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 14 },
              ]}
            >
              Proprietor 2 Details
            </Text>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Full Name
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
              value={p2Name}
              onChangeText={setP2Name}
              placeholder="Proprietor 2 full name"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Address
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
              value={p2Address}
              onChangeText={setP2Address}
              placeholder="Residential address"
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Phone Number
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
              value={p2Phone}
              onChangeText={setP2Phone}
              placeholder="080XXXXXXXX"
              maxLength={11}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Email
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
              autoCapitalize="none"
              value={p2Email}
              onChangeText={setP2Email}
              placeholder="example@mail.com"
            />

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 6 },
              ]}
            >
              Proprietor 2 — Uploads & Signature
            </Text>
            <ProprietorUploads
              passport={p2Passport}
              nin={p2Nin}
              onPickPassport={() => pickImage("p2passport")}
              onPickNin={() => pickImage("p2nin")}
              sigValue={p2Signature}
              sigIndex={2}
            />

            {/* Submit */}
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

      {/* ── Signature Modal (shared for both proprietors) ── */}
      <Modal
        isVisible={activeSig !== null}
        onBackdropPress={() => setActiveSig(null)}
        style={styles.sigModal}
      >
        <View
          style={[styles.sigContainer, { backgroundColor: colors.background }]}
        >
          <View style={styles.sigHeader}>
            <Text style={[styles.sigTitle, { color: colors.text }]}>
              Proprietor {activeSig} — Draw Signature (Blue)
            </Text>
            <TouchableOpacity onPress={() => setActiveSig(null)}>
              <Text style={{ color: "#d14343", fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 200, width: "100%" }}>
            <SignatureScreen
              ref={activeRef}
              onOK={handleSignatureSaved}
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
              onPress={() => activeRef.current?.clearSignature()}
            >
              <Text style={[styles.sigButtonText, { color: "#2b2e80" }]}>
                Clear
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sigButton, { backgroundColor: "#2b2e80" }]}
              onPress={() => activeRef.current?.readSignature()}
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
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLink: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  headerTitle: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  content: { paddingHorizontal: 18, paddingTop: 20 },
  noteBubble: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    position: "relative",
  },
  noteTitle: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  noteText: { fontSize: 12 },
  noteAmount: { fontWeight: "700" },
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
  sectionTitle: { fontSize: 13, fontWeight: "700", marginBottom: 12 },
  inputLabel: { fontSize: 11, marginBottom: 6 },
  textInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  uploadRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
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
    marginBottom: 16,
    overflow: "hidden",
  },
  uploadLabelText: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  uploadSubText: { fontSize: 10 },
  previewImage: { width: "100%", height: "100%" },
  previewSignature: { width: "100%", height: "100%", backgroundColor: "#fff" },
  continueButton: { marginTop: 10 },
  continueGradient: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  sigModal: { margin: 20, justifyContent: "center" },
  sigContainer: { height: 400, borderRadius: 24, padding: 20 },
  sigHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sigTitle: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  sigFooter: { flexDirection: "row", gap: 12, marginTop: 20 },
  sigButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sigButtonText: { fontSize: 15, fontWeight: "700" },
});

export default CompanyRegistration;
