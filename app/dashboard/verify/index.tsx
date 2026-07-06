import { verification } from "@/constants/features";
import { styles } from "@/constants/styles";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Verify() {
  const { isDark, colors } = useTheme();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item.id;
    return (
      <View style={style.card}>
        <TouchableOpacity
          style={style.header}
          onPress={() => toggleExpand(item.id)}
        >
          <Text style={style.title}>{item.label}</Text>
          <Text>{isExpanded ? "▼" : "▲"}</Text>
        </TouchableOpacity>
        {isExpanded && (
          <FlatList
            data={item.subList}
            renderItem={({ item }) => {
              return (
                <View style={style.content}>
                  <Text>{item.name}</Text>
                </View>
              );
            }}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { marginTop: 25, backgroundColor: colors.background },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={style.header}>
        <Text
          style={[
            style.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Verifications
        </Text>
      </View>

      <View style={styles.servicesGrid}>
        {verification.map((service) => (
          <TouchableOpacity
            activeOpacity={0.75}
            key={service.id}
            style={styles.serviceCard}
            onPress={() => {
              if (service.id === "nin") {
                router.push("/dashboard/verify/nin");
              }
              if (service.id === "bvn") {
                router.push("/dashboard/verify/bvn");
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
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
  },

  title: { fontSize: 16, fontWeight: "bold" },
  content: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#f9f9f9",
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
});
