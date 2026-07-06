// hooks/usePushNotifications.ts

import { endPoints } from "@/constants/urls";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { EventSubscription } from "expo-modules-core";
import {
    addNotificationReceivedListener,
    addNotificationResponseReceivedListener,
    AndroidImportance,
    getExpoPushTokenAsync,
    getPermissionsAsync,
    Notification,
    NotificationResponse,
    requestPermissionsAsync,
    setNotificationChannelAsync,
    setNotificationHandler,
} from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "expo_push_token";

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications(userToken: string | null) {
  const notificationListener = useRef<EventSubscription | null>(null);

  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!userToken) return;

    async function register() {
      try {
        if (!Device.isDevice) {
          console.log("Push notifications require a physical device.");
          return;
        }

        // Request permission
        const { status: existingStatus } = await getPermissionsAsync();

        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await requestPermissionsAsync();

          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("Notification permission denied.");
          return;
        }

        // Android notification channel
        if (Platform.OS === "android") {
          await setNotificationChannelAsync("default", {
            name: "AdilData Notifications",
            importance: AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: "default",
          });
        }

        // Get Expo project ID
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        if (!projectId) {
          throw new Error(
            "Expo projectId not found. Check app.json/app.config.ts",
          );
        }

        // Generate Expo Push Token
        const tokenData = await getExpoPushTokenAsync({
          projectId,
        });

        const expoPushToken = tokenData.data;

        console.log("Expo Push Token:", expoPushToken);

        // Prevent duplicate registrations
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedToken === expoPushToken) {
          console.log("Push token already registered.");
          return;
        }

        // Save token on backend
        const response = await fetch(endPoints.pushNotification, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: userToken,
            expo_push_token: expoPushToken,
            platform: Platform.OS,
          }),
        });

        const result = await response.json();

        console.log("Push registration response:", result);

        if (response.ok) {
          await AsyncStorage.setItem(STORAGE_KEY, expoPushToken);
        }
      } catch (error) {
        console.log("Push notification registration error:", error);
      }
    }

    register();

    notificationListener.current = addNotificationReceivedListener(
      (notification: Notification) => {
        console.log("Notification received:", notification);
      },
    );

    responseListener.current = addNotificationResponseReceivedListener(
      (response: NotificationResponse) => {
        const data = response.notification.request.content.data;

        console.log("Notification tapped:", data);

        const screen = data?.screen as string | undefined;

        if (!screen) return;
      },
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }

      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userToken]);
}
