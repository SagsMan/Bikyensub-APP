import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";

import { GestureResponderEvent } from "react-native";

interface GradientButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  loading?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  loading = false,
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  return loading ? (
    <ActivityIndicator size="small" color={colors.primary} />
  ) : (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={loading}>
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default GradientButton;

const styles = StyleSheet.create({
  button: {
    width: "95%",
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: "auto",
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
  },
});
