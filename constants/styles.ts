import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  LogoImg: {
    width: 300,
    overflow: "hidden",
    height: 140,
    borderRadius: 10,
    // backgroundColor:"midnightblue"
  },

  LogoImgB: {
    width: "40%",
    height: "40%",
    marginHorizontal: "auto",
    borderRadius: 10,
    margin: 0,
  },

  titleText: {
    fontSize: 17,
    textAlign: "center",
    marginTop: 10,
    color: "black",
    marginHorizontal: 30,
  },

  welcom: {
    textAlign: "center",
    fontSize: 24,
    marginBottom: 10,
    marginTop: 50,
    fontWeight: "600",
  },

  welB: {
    fontSize: 14,
    marginTop: -70,
    marginRight: -12,
  },

  pl: {
    fontSize: 15,
    marginBottom: -10,
    marginHorizontal: 15,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  safeArea: {
    flex: 1,
    paddingBottom: -50,
  },
  container: {
    flex: 1,
  },

  headerWrap: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerCard: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    height: 45,
    width: 45,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 35,
    height: 35,
    // tintColor: "#2d6fb7",
  },
  headerTextWrap: {
    flex: 1,
  },
  userName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  userType: {
    color: "#e6eeff",
    fontSize: 12,
    marginTop: 2,
  },
  balanceWrap: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    color: "#e6eeff",
    fontSize: 12,
  },
  balanceValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  bankCard: {
    marginHorizontal: 20,
    marginTop: -108,
    borderRadius: 26,
    overflow: "hidden",
    elevation: 2,
  },
  bankCardImage: {
    borderRadius: 26,
  },
  bankCardOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: 18,
  },
  bankRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  bankTitle: {
    color: "#1a2b6d",
    fontSize: 16,
    fontWeight: "700",
  },
  bankSub: {
    color: "#6b778c",
    fontSize: 11,
    marginTop: 2,
  },
  fundButton: {
    backgroundColor: "#2d6fb7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  fundButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  bankInfoGroup: {
    marginTop: 12,
  },
  bankLabel: {
    color: "#6b778c",
    fontSize: 11,
  },
  bankValue: {
    color: "#1a1f36",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  bankFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bankOwner: {
    color: "#1a1f36",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    paddingRight: 8,
  },
  bankBadge: {
    height: 40,
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#2d6fb7",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bankBadgeIcon: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    overflow: "hidden",
    borderRadius: 10,
    elevation: 3,
    // tintColor: "#2d6fb7",
  },
  bankBadgeText: {
    color: "#2d6fb7",
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#1a2b6d",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "flex-start",
  },
  serviceCard: {
    width: "31%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",

    marginBottom: 12,
  },
  serviceIconWrap: {
    borderWidth: 1,
    borderColor: "#e6ecff",
    shadowColor: "#99a7d7",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    height: 80,
    width: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceIcon: {
    width: 45,
    height: 45,
    // tintColor: "#2d6fb7",
  },
  serviceLabel: {
    color: "#1a1f36",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
  },
  transactionsCard: {
    marginHorizontal: 20,
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
