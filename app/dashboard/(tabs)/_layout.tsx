// app/dashboard/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    AppState,
    AppStateStatus,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import LockOverlay from "../../components/LockOverlay";

const tabLabels: Record<string, string> = {
  index: "Home",
  transactions: "Transactions",
  contact: "Contact Us",
  profile: "Profile",
};

const tabIcons: Record<
  string,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: {
    active: "home",
    inactive: "home-outline",
  },
  transactions: {
    active: "receipt",
    inactive: "receipt-outline",
  },
  contact: {
    active: "call",
    inactive: "call-outline",
  },
  profile: {
    active: "person",
    inactive: "person-outline",
  },
};

export default function TabsLayout() {
  const { isDark, colors } = useTheme();

  const insets = useSafeAreaInsets();

  const pathname = usePathname();

  const [isLocked, setIsLocked] = useState(false);

  const appState = useRef(AppState.currentState);

  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        // App moved to background
        if (
          appState.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          backgroundTime.current = Date.now();
        }

        // App returned to foreground
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          if (backgroundTime.current) {
            const timeElapsed = Date.now() - backgroundTime.current;

            if (timeElapsed > 5000) {
              setIsLocked(true);
            }
          }

          backgroundTime.current = null;
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [pathname]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
        tabBar={({ state, navigation }) => (
          <View
            style={[
              styles.bottomNav,
              {
                marginBottom: Math.max(insets.bottom, 0),
                minHeight: 75,
                backgroundColor: isDark
                  ? "rgba(30, 41, 59, 0.98)"
                  : "rgba(255,255,255,0.96)",
                shadowColor: colors.primary,
              },
            ]}
          >
            {state.routes.map((route) => {
              const isFocused = state.routes[state.index]?.key === route.key;

              const label = tabLabels[route.name] ?? route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={[
                    styles.navItem,
                    isFocused && [
                      styles.navItemActive,
                      {
                        backgroundColor: isDark
                          ? "rgba(76, 81, 191, 0.15)"
                          : "#eef4ff",
                      },
                    ],
                  ]}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={
                      tabIcons[route.name]
                        ? isFocused
                          ? tabIcons[route.name].active
                          : tabIcons[route.name].inactive
                        : "ellipse-outline"
                    }
                    size={22}
                    color={
                      isFocused ? colors.accent : isDark ? "#94a3b8" : "#6b778c"
                    }
                  />

                  <Text
                    style={[
                      styles.navLabel,
                      {
                        color: isFocused
                          ? colors.accent
                          : isDark
                            ? "#94a3b8"
                            : "#6b778c",
                      },
                      isFocused && styles.navLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      >
        <Tabs.Screen name="index" />

        <Tabs.Screen name="transactions" />

        <Tabs.Screen name="contact" />

        <Tabs.Screen name="profile" />
      </Tabs>

      {isLocked && <LockOverlay onUnlock={() => setIsLocked(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 22,

    flexDirection: "row",

    justifyContent: "space-around",

    alignItems: "center",

    shadowColor: "#1a2b6d",

    shadowOpacity: 0.12,

    shadowRadius: 18,

    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 10,
  },

  navItem: {
    alignItems: "center",

    justifyContent: "center",

    flex: 1,

    paddingVertical: 12,

    paddingHorizontal: 8,

    borderRadius: 14,
  },

  navItemActive: {
    paddingVertical: 15,
  },

  navLabel: {
    fontSize: 10,
  },

  navLabelActive: {
    fontWeight: "600",
  },
});
