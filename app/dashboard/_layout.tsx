// import { Ionicons } from "@expo/vector-icons";
// import { Tabs, usePathname, useRouter } from "expo-router";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   AppState,
//   AppStateStatus,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useTheme } from "@/context/ThemeContext";
// import LockOverlay from "../components/LockOverlay";

// const tabLabels: Record<string, string> = {
//   index: "Home",
//   transactions: "Transactions",
//   contact: "Contact Us",
//   profile: "Profile",
// };

// const tabIcons: Record<
//   string,
//   {
//     active: keyof typeof Ionicons.glyphMap;
//     inactive: keyof typeof Ionicons.glyphMap;
//   }
// > = {
//   index: { active: "home", inactive: "home-outline" },
//   transactions: { active: "receipt", inactive: "receipt-outline" },
//   contact: { active: "call", inactive: "call-outline" },
//   profile: { active: "person", inactive: "person-outline" },
// };

// export default function RootLayout() {
//   const { isDark, colors } = useTheme();
//   const insets = useSafeAreaInsets();
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isLocked, setIsLocked] = useState(false);
//   const appState = useRef(AppState.currentState);
//   const backgroundTime = useRef<number | null>(null);

//   useEffect(() => {
//     const subscription = AppState.addEventListener(
//       "change",
//       (nextAppState: AppStateStatus) => {
//         if (
//           appState.current.match(/active/) &&
//           nextAppState.match(/inactive|background/)
//         ) {
//           // App went to background
//           backgroundTime.current = Date.now();
//         }

//         if (
//           appState.current.match(/inactive|background/) &&
//           nextAppState === "active"
//         ) {
//           // App came to foreground
//           if (backgroundTime.current) {
//             const timeElapsed = Date.now() - backgroundTime.current;
//             if (timeElapsed > 5000) {
//               // App locked - show overlay
//               setIsLocked(true);
//             }
//           }
//           backgroundTime.current = null;
//         }

//         appState.current = nextAppState;
//       },
//     );

//     return () => {
//       subscription.remove();
//     };
//   }, [pathname]);

//   return (
//     <>
//       <Tabs
//         screenOptions={{
//           headerShown: false,
//           sceneStyle: { backgroundColor: colors.background },
//           tabBarStyle: {
//             position: "absolute",
//             backgroundColor: "transparent",
//             borderTopWidth: 0,
//             elevation: 0,
//           },
//         }}
//         tabBar={({ state, navigation }) =>
//           state.routes[state.index]?.name === "airtime" ||
//           state.routes[state.index]?.name === "airtime-success" ||
//           state.routes[state.index]?.name === "airtime-failed" ||
//           state.routes[state.index]?.name === "data" ||
//           state.routes[state.index]?.name === "data-success" ||
//           state.routes[state.index]?.name === "data-failed" ||
//           state.routes[state.index]?.name === "electricity" ||
//           state.routes[state.index]?.name === "electricity-success" ||
//           state.routes[state.index]?.name === "electricity-failed" ||
//           state.routes[state.index]?.name === "tv" ||
//           state.routes[state.index]?.name === "tv-success" ||
//           state.routes[state.index]?.name === "tv-failed" ||
//           state.routes[state.index]?.name === "exams" ||
//           state.routes[state.index]?.name === "exams-success" ||
//           state.routes[state.index]?.name === "exams-failed" ||
//           state.routes[state.index]?.name === "set-pin" ||
//           state.routes[state.index]?.name === "cac" ||
//           state.routes[state.index]?.name === "cac-business" ||
//           state.routes[state.index]?.name === "cac-company" ||
//           state.routes[state.index]?.name === "cac-success" ||
//           state.routes[state.index]?.name === "cac-failed" ||
//           state.routes[state.index]?.name === "transfer" ||
//           state.routes[state.index]?.name === "verify/index" ? null : (
//             <View
//               style={[
//                 styles.bottomNav,
//                 {
//                   marginBottom: Math.max(insets.bottom, 0),
//                   minHeight: 75,
//                   backgroundColor: isDark
//                     ? "rgba(30, 41, 59, 0.98)"
//                     : "rgba(255,255,255,0.96)",
//                   shadowColor: colors.primary,
//                 },
//               ]}
//             >
//               {state.routes
//                 .filter(
//                   (route) =>
//                     route.name !== "airtime" &&
//                     route.name !== "airtime-success" &&
//                     route.name !== "airtime-failed" &&
//                     route.name !== "data" &&
//                     route.name !== "data-success" &&
//                     route.name !== "data-failed" &&
//                     route.name !== "electricity" &&
//                     route.name !== "electricity-success" &&
//                     route.name !== "electricity-failed" &&
//                     route.name !== "tv" &&
//                     route.name !== "tv-success" &&
//                     route.name !== "tv-failed" &&
//                     route.name !== "exams" &&
//                     route.name !== "exams-success" &&
//                     route.name !== "exams-failed" &&
//                     route.name !== "set-pin" &&
//                     route.name !== "cac" &&
//                     route.name !== "cac-business" &&
//                     route.name !== "cac-company" &&
//                     route.name !== "cac-success" &&
//                     route.name !== "cac-failed" &&
//                     route.name !== "verify/index" &&
//                     route.name !== "transfer",
//                 )
//                 .map((route) => {
//                   const isFocused =
//                     state.routes[state.index]?.key === route.key;
//                   const label = tabLabels[route.name] ?? route.name;

//                   const onPress = () => {
//                     const event = navigation.emit({
//                       type: "tabPress",
//                       target: route.key,
//                       canPreventDefault: true,
//                     });

//                     if (!isFocused && !event.defaultPrevented) {
//                       navigation.navigate(route.name);
//                     }
//                   };

//                   return (
//                     <TouchableOpacity
//                       key={route.key}
//                       onPress={onPress}
//                       style={[
//                         styles.navItem,
//                         isFocused && [
//                           styles.navItemActive,
//                           {
//                             backgroundColor: isDark
//                               ? "rgba(76, 81, 191, 0.15)"
//                               : "#eef4ff",
//                           },
//                         ],
//                       ]}
//                       activeOpacity={0.75}
//                     >
//                       <Ionicons
//                         name={
//                           tabIcons[route.name]
//                             ? isFocused
//                               ? tabIcons[route.name].active
//                               : tabIcons[route.name].inactive
//                             : "ellipse-outline"
//                         }
//                         size={22}
//                         color={
//                           isFocused
//                             ? colors.accent
//                             : isDark
//                               ? "#94a3b8"
//                               : "#6b778c"
//                         }
//                       />
//                       <Text
//                         style={[
//                           styles.navLabel,
//                           {
//                             color: isFocused
//                               ? colors.accent
//                               : isDark
//                                 ? "#94a3b8"
//                                 : "#6b778c",
//                           },
//                           isFocused && styles.navLabelActive,
//                         ]}
//                       >
//                         {label}
//                       </Text>
//                     </TouchableOpacity>
//                   );
//                 })}
//             </View>
//           )
//         }
//       >
//         <Tabs.Screen name="index" />
//         <Tabs.Screen
//           name="airtime"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="airtime-success"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="airtime-failed"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="data"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="data-success"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="data-failed"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="electricity"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="electricity-success"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="electricity-failed"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="tv"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="tv-success"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="tv-failed"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="exams"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="exams-success"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="exams-failed"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="set-pin"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="cac"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="cac-business"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="cac-company"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="cac-success"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="cac-failed"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="verify"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen
//           name="transfer"
//           options={{
//             href: null,
//           }}
//         />
//         <Tabs.Screen name="transactions" />
//         <Tabs.Screen name="contact" />
//         <Tabs.Screen name="profile" />
//       </Tabs>

//       {isLocked && <LockOverlay onUnlock={() => setIsLocked(false)} />}
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   bottomNav: {
//     marginHorizontal: 16,
//     marginBottom: 12,
//     borderRadius: 22,
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     shadowColor: "#1a2b6d",
//     shadowOpacity: 0.12,
//     shadowRadius: 18,
//     shadowOffset: { width: 0, height: 10 },
//     elevation: 10,
//   },
//   navItem: {
//     alignItems: "center",
//     justifyContent: "center",
//     flex: 1,
//     paddingVertical: 2,
//     paddingHorizontal: 8,
//     borderRadius: 14,
//   },
//   navItemActive: {
//     paddingVertical: 15,
//   },
//   navIcon: {
//     color: "#6b778c",
//     marginBottom: 2,
//   },
//   navIconActive: {
//     color: "#2d6fb7",
//   },
//   navLabel: {
//     fontSize: 10,
//     color: "#6b778c",
//   },
//   navLabelActive: {
//     color: "#2d6fb7",
//     fontWeight: "600",
//   },
// });

// app/dashboard/_layout.tsx

import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
