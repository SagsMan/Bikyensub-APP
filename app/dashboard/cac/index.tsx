import Header from "@/app/components/header";
import { endPoints } from "@/constants/urls";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Helpers ─────────────────────────────────────────────────────────────

/** Convert relative path like ../uploads/file.png → full URL */
const toImageUrl = (path?: string | null): string | null => {
  if (!path || typeof path !== "string" || path.trim() === "") return null;

  // If it's already a full URL, return it
  if (path.startsWith("http")) return path;

  // Extract just the filename (last part after any slash)
  const filename = path.split("/").pop()?.trim();
  if (!filename) return null;

  return `https://rahausub.com.ng/easyfinder/uploads/${filename}`;
};

/** Status label: 0 → Pending, 1 → Action Needed, others pass-through */
const statusLabel = (raw: any): string => {
  if (raw === 0 || raw === "0") return "Pending";
  if (raw === 1 || raw === "1") return "Action Needed";
  return String(raw ?? "Pending");
};

/** Status color */
const statusColor = (raw: any): string => {
  if (raw === 0 || raw === "0") return "#f59e0b"; // amber – pending
  if (raw === 1 || raw === "1") return "#f97316"; // orange – action needed
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("approv") || s.includes("success")) return "#16a34a"; // green
  if (s.includes("declin") || s.includes("fail") || s.includes("cancel"))
    return "#dc2626"; // red
  return "#f59e0b"; // default amber
};

// ── Sub-components ───────────────────────────────────────────────────────

const DetailRow = ({
  label,
  value,
  colors,
}: {
  label: string;
  value?: string | null;
  colors: any;
}) => (
  <View style={dStyles.row}>
    <Text style={[dStyles.label, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[dStyles.value, { color: colors.text }]}>{value || "-"}</Text>
  </View>
);

const UploadImage = ({
  url,
  caption,
  colors,
}: {
  url: string | null;
  caption: string;
  colors: any;
}) => {
  if (!url) return null;
  return (
    <View style={dStyles.imageWrap}>
      <Text style={[dStyles.imageCaption, { color: colors.textMuted }]}>
        {caption}
      </Text>
      <Image source={{ uri: url }} style={dStyles.image} resizeMode="contain" />
    </View>
  );
};

// ── Main Component ───────────────────────────────────────────────────────
const CacRegistration = () => {
  const { isDark, colors } = useTheme();

  const [businessRows, setBusinessRows] = useState<any[]>([]);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  const [companyRows, setCompanyRows] = useState<any[]>([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch ──
  const fetchBusiness = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(endPoints.getCACBusinessNames, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setBusinessRows(
        data.success && Array.isArray(data.data) ? data.data : [],
      );
    } catch {
      setBusinessRows([]);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const fetchCompany = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const res = await fetch(endPoints.getCACCompanyReg, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setCompanyRows(data.success && Array.isArray(data.data) ? data.data : []);
    } catch {
      setCompanyRows([]);
    } finally {
      setLoadingCompany(false);
    }
  };

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else {
      setLoadingBusiness(true);
      setLoadingCompany(true);
    }
    await Promise.all([fetchBusiness(), fetchCompany()]);
    if (isRefresh) setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, []),
  );

  // ── Contact button helper ──
  const goContact = (closeModal: () => void) => {
    closeModal();
    setTimeout(() => router.push("/dashboard/contact"), 300);
  };

  // ── Render ───────────────────────────────────────────────────────────────
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAll(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Header title="CAC Registration" />

          <View style={styles.content}>
            <Text style={[styles.welcome, { color: colors.textMuted }]}>
              Welcome Back
            </Text>

            {/* Action Cards */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: isDark ? colors.surface : "#eef4ff",
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push("/dashboard/cac/cac-business")}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Business Name{"\n"}Registration
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: isDark ? colors.surface : "#f1f2ff",
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push("/dashboard/cac/cac-company")}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>
                  New Company{"\n"}Registration
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── BUSINESS NAME TABLE ── */}
            <View
              style={[styles.sectionHeader, { borderColor: colors.border }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Business Name Registration
              </Text>
            </View>

            {loadingBusiness ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 20 }}
              />
            ) : businessRows.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No business registrations found.
              </Text>
            ) : (
              <View style={[styles.tableCard, { borderColor: colors.border }]}>
                <View
                  style={[
                    styles.tableHeaderRow,
                    { backgroundColor: isDark ? colors.surface : "#f5f7ff" },
                  ]}
                >
                  <Text
                    style={[styles.th, { flex: 2, color: colors.textMuted }]}
                  >
                    Business Name
                  </Text>
                  <Text
                    style={[styles.th, { flex: 1.3, color: colors.textMuted }]}
                  >
                    Status
                  </Text>
                  <Text
                    style={[styles.th, { width: 60, color: colors.textMuted }]}
                  >
                    Action
                  </Text>
                </View>
                {businessRows.map((row, i) => (
                  <View
                    key={`b-${i}`}
                    style={[
                      styles.tableRow,
                      i !== 0 && [
                        styles.tableRowBorder,
                        { borderTopColor: colors.border },
                      ],
                    ]}
                  >
                    <Text
                      style={[styles.td, { flex: 2, color: colors.text }]}
                      numberOfLines={2}
                    >
                      {row.proposed_name_1 ?? "-"}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          flex: 1.3,
                          backgroundColor: statusColor(row.status) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: statusColor(row.status) },
                        ]}
                      >
                        {statusLabel(row.status)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ width: 60, alignItems: "center" }}
                      onPress={() => setSelectedBusiness(row)}
                    >
                      <Text style={[styles.viewBtn, { color: colors.primary }]}>
                        View
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── COMPANY REGISTRATION TABLE ── */}
            <View
              style={[
                styles.sectionHeader,
                { borderColor: colors.border, marginTop: 28 },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Company Registration
              </Text>
            </View>

            {loadingCompany ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 20 }}
              />
            ) : companyRows.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No company registrations found.
              </Text>
            ) : (
              <View style={[styles.tableCard, { borderColor: colors.border }]}>
                <View
                  style={[
                    styles.tableHeaderRow,
                    { backgroundColor: isDark ? colors.surface : "#f5f7ff" },
                  ]}
                >
                  <Text
                    style={[styles.th, { flex: 2, color: colors.textMuted }]}
                  >
                    Company Name
                  </Text>
                  <Text
                    style={[styles.th, { flex: 1.3, color: colors.textMuted }]}
                  >
                    Status
                  </Text>
                  <Text
                    style={[styles.th, { width: 60, color: colors.textMuted }]}
                  >
                    Action
                  </Text>
                </View>
                {companyRows.map((row, i) => (
                  <View
                    key={`c-${i}`}
                    style={[
                      styles.tableRow,
                      i !== 0 && [
                        styles.tableRowBorder,
                        { borderTopColor: colors.border },
                      ],
                    ]}
                  >
                    <Text
                      style={[styles.td, { flex: 2, color: colors.text }]}
                      numberOfLines={2}
                    >
                      {row.proposed_name_1 ?? "-"}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          flex: 1.3,
                          backgroundColor: statusColor(row.status) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: statusColor(row.status) },
                        ]}
                      >
                        {statusLabel(row.status)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ width: 60, alignItems: "center" }}
                      onPress={() => setSelectedCompany(row)}
                    >
                      <Text style={[styles.viewBtn, { color: colors.primary }]}>
                        View
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ══ BUSINESS DETAIL MODAL ══ */}
      <Modal
        isVisible={selectedBusiness !== null}
        onBackdropPress={() => setSelectedBusiness(null)}
        style={styles.modal}
      >
        {selectedBusiness && (
          <View
            style={[styles.modalCard, { backgroundColor: colors.background }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Business Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedBusiness(null)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status badge */}
              <View
                style={[
                  dStyles.statusBadge,
                  {
                    backgroundColor:
                      statusColor(selectedBusiness.status) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    dStyles.statusText,
                    { color: statusColor(selectedBusiness.status) },
                  ]}
                >
                  {statusLabel(selectedBusiness.status)}
                </Text>
              </View>

              <DetailRow
                label="Surname"
                value={selectedBusiness.sname}
                colors={colors}
              />
              <DetailRow
                label="Proposed Name 1"
                value={selectedBusiness.proposed_name_1}
                colors={colors}
              />
              <DetailRow
                label="Proposed Name 2"
                value={selectedBusiness.proposed_name_2}
                colors={colors}
              />
              <DetailRow
                label="Nature of Business"
                value={selectedBusiness.nature_of_business}
                colors={colors}
              />
              <DetailRow
                label="Business Address"
                value={selectedBusiness.business_address}
                colors={colors}
              />
              <DetailRow
                label="Proprietor Address"
                value={selectedBusiness.proprietor_address}
                colors={colors}
              />
              <DetailRow
                label="Phone"
                value={selectedBusiness.proprietor_phone}
                colors={colors}
              />
              <DetailRow
                label="Email"
                value={
                  selectedBusiness.proprietor_email ?? selectedBusiness.email
                }
                colors={colors}
              />
              <DetailRow
                label="Date Submitted"
                value={
                  selectedBusiness.created_at ?? selectedBusiness.date_submitted
                }
                colors={colors}
              />

              {/* Uploaded images */}
              <Text style={[dStyles.group, { color: colors.primary }]}>
                Uploaded Documents
              </Text>
              <UploadImage
                url={toImageUrl(selectedBusiness.proprietor_passport)}
                caption="Passport Photo"
                colors={colors}
              />
              <UploadImage
                url={toImageUrl(selectedBusiness.proprietor_signature)}
                caption="Signature"
                colors={colors}
              />
              <UploadImage
                url={toImageUrl(selectedBusiness.nin)}
                caption="NIN Card"
                colors={colors}
              />

              {/* Contact button */}
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: colors.primary }]}
                onPress={() => goContact(() => setSelectedBusiness(null))}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text
                  style={[styles.contactBtnText, { color: colors.primary }]}
                >
                  Contact Support
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* ══ COMPANY DETAIL MODAL ══ */}
      <Modal
        isVisible={selectedCompany !== null}
        onBackdropPress={() => setSelectedCompany(null)}
        style={styles.modal}
      >
        {selectedCompany && (
          <View
            style={[styles.modalCard, { backgroundColor: colors.background }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Company Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedCompany(null)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status badge */}
              <View
                style={[
                  dStyles.statusBadge,
                  {
                    backgroundColor: statusColor(selectedCompany.status) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    dStyles.statusText,
                    { color: statusColor(selectedCompany.status) },
                  ]}
                >
                  {statusLabel(selectedCompany.status)}
                </Text>
              </View>

              <Text style={[dStyles.group, { color: colors.primary }]}>
                Company Info
              </Text>
              <DetailRow
                label="Proposed Name 1"
                value={selectedCompany.proposed_name_1}
                colors={colors}
              />
              <DetailRow
                label="Proposed Name 2"
                value={selectedCompany.proposed_name_2}
                colors={colors}
              />
              <DetailRow
                label="Classification"
                value={selectedCompany.classification}
                colors={colors}
              />
              <DetailRow
                label="Nature of Company"
                value={selectedCompany.nature_of_company}
                colors={colors}
              />
              <DetailRow
                label="Company Address"
                value={selectedCompany.company_address}
                colors={colors}
              />
              <DetailRow
                label="Date Submitted"
                value={selectedCompany.date_submitted}
                colors={colors}
              />

              <Text style={[dStyles.group, { color: colors.primary }]}>
                Proprietor 1
              </Text>
              <DetailRow
                label="Name"
                value={selectedCompany.proprietor_1_name}
                colors={colors}
              />
              <DetailRow
                label="Address"
                value={selectedCompany.proprietor_1_address}
                colors={colors}
              />
              <DetailRow
                label="Phone"
                value={selectedCompany.proprietor_1_phone}
                colors={colors}
              />
              <DetailRow
                label="Email"
                value={selectedCompany.proprietor_1_email}
                colors={colors}
              />

              <Text style={[dStyles.group, { color: colors.primary }]}>
                Proprietor 2
              </Text>
              <DetailRow
                label="Name"
                value={selectedCompany.proprietor_2_name}
                colors={colors}
              />
              <DetailRow
                label="Address"
                value={selectedCompany.proprietor_2_address}
                colors={colors}
              />
              <DetailRow
                label="Phone"
                value={selectedCompany.proprietor_2_phone}
                colors={colors}
              />
              <DetailRow
                label="Email"
                value={selectedCompany.proprietor_2_email}
                colors={colors}
              />

              {/* Uploaded images */}
              <Text style={[dStyles.group, { color: colors.primary }]}>
                Proprietor 1 Documents
              </Text>
              <UploadImage
                url={toImageUrl(selectedCompany.proprietor_1_passport)}
                caption="Passport Photo"
                colors={colors}
              />
              <UploadImage
                url={toImageUrl(selectedCompany.proprietor_1_signature)}
                caption="Signature"
                colors={colors}
              />
              <UploadImage
                url={toImageUrl(selectedCompany.proprietor_1_nin)}
                caption="NIN Card"
                colors={colors}
              />

              <Text style={[dStyles.group, { color: colors.primary }]}>
                Proprietor 2 Documents
              </Text>
              <UploadImage
                url={toImageUrl(selectedCompany.proprietor_2_passport)}
                caption="Passport Photo"
                colors={colors}
              />
              <UploadImage
                url={toImageUrl(selectedCompany.proprietor_2_signature)}
                caption="Signature"
                colors={colors}
              />
              <UploadImage
                url={toImageUrl(selectedCompany.proprietor_2_nin)}
                caption="NIN Card"
                colors={colors}
              />

              <Text style={[dStyles.group, { color: colors.primary }]}>
                Official Documents
              </Text>
              <UploadImage
                url={toImageUrl(selectedCompany.cac_doc)}
                caption="CAC Document"
                colors={colors}
              />

              {/* Contact button */}
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: colors.primary }]}
                onPress={() => goContact(() => setSelectedCompany(null))}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text
                  style={[styles.contactBtnText, { color: colors.primary }]}
                >
                  Contact Support
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

// ── Detail modal styles ───────────────────────────────────────────────────
const dStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  label: { fontSize: 12, flex: 1, paddingRight: 8 },
  value: { fontSize: 12, fontWeight: "600", flex: 1.4, textAlign: "right" },
  statusBadge: {
    alignSelf: "center",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 18,
    marginBottom: 14,
    marginTop: 4,
  },
  statusText: { fontSize: 13, fontWeight: "700" },
  group: { fontSize: 12, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  imageWrap: { marginBottom: 12 },
  imageCaption: { fontSize: 11, marginBottom: 4 },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    marginVertical: 8,
  },
});

// ── Page styles ───────────────────────────────────────────────────────────
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
  headerTitle: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  content: { paddingHorizontal: 18, paddingTop: 20 },
  welcome: { fontSize: 12, marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  actionText: { fontSize: 12, textAlign: "center", fontWeight: "600" },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  sectionTitle: { textAlign: "center", fontSize: 12, fontWeight: "600" },
  emptyText: { textAlign: "center", fontSize: 12, marginVertical: 16 },
  tableCard: { borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", paddingHorizontal: 6 },
  th: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 11,
    fontWeight: "700",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tableRowBorder: { borderTopWidth: 1 },
  td: { paddingHorizontal: 6, fontSize: 11 },
  statusPill: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "center",
    marginHorizontal: 4,
  },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  viewBtn: { fontSize: 12, fontWeight: "700" },
  modal: { justifyContent: "flex-end", margin: 0 },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 15, fontWeight: "700" },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  contactBtnText: { fontSize: 14, fontWeight: "700" },
});

export default CacRegistration;
