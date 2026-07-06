import { NotificationType } from "@/constants/types";
import { endPoints } from "@/constants/urls";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type NotificationStore = {
  notifications: NotificationType[];
  unreadCount: number;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) return;
    try {
      const response = await fetch(endPoints.getAllNotifications, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": userToken,
        },
        // body: JSON.stringify({ token: userToken }),
      });
      const result = await response.json();

      const notifications: NotificationType[] = result.data.notifications.map(
        (n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.created_at,
          isRead: n.is_read,
        }),
      );

      set({
        notifications,
        unreadCount: result.data.unread_count,
      });
    } catch (error) {
      console.log(error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      const response = await fetch(endPoints.getUnreadNotificationCount, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "X-API-Token": userToken,
        },
        body: JSON.stringify({ token: userToken }),
      });
      const result = await response.json();

      set({
        unreadCount: Number(result.count || 0),
      });
    } catch (error) {
      console.log(error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      fetch(endPoints.markNotificationAsRead, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, token: userToken }),
      });

      set((state) => ({
        notifications: state.notifications.map((n) =>
          String(n.id) === String(id) ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.log(error);
    }
  },

  markAllAsRead: async () => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      fetch(endPoints.markAllNotificationsAsRead, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: userToken }),
      });

      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useNotificationStore;
