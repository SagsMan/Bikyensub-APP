import { AppLogo } from "@/constants/images";
import { styles } from "@/constants/styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import GradientButton from "./components/buttons";

export default function Index() {
  const { isDark, colors } = useTheme();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (userToken) {
        // User is logged in, redirect to login for authentication
        router.replace("/Login");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignSelf: "stretch",
        justifyContent: "space-between",
        paddingVertical: 40,
        padding: 20,
        alignItems: "center",
      }}
    >
      <View
        style={{
          maxHeight: "50%",
        }}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <Text style={[styles.welcom, { color: colors.text }]}>Welcome To</Text>

        <View style={styles.LogoImg}>
          <Image source={AppLogo} style={styles.LogoImgB} />
        </View>

        <Text style={[styles.titleText, styles.welB, { color: colors.text }]}>
          Fast. Simple. Reliable.
        </Text>
      </View>

      <View style={{ marginBottom: 50 }}>
        <Text
          style={[styles.titleText, styles.pl, { color: colors.textMuted }]}
        >
          Your one-stop destination for instant airtime, affordable data
          bundles, and seamless utility bill payments. Experience connectivity
          without limits.
        </Text>
        <GradientButton
          title="Get Started"
          onPress={() => {
            router.push("/Register");
          }}
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
              marginTop: 20,
              color: colors.primary,
            }}
          >
            Already Have an Account? Log In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
