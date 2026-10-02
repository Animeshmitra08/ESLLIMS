import { Platform } from "react-native";
import {
  deleteToken,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
} from "@react-native-firebase/messaging";
import notifee, { AndroidImportance, AndroidStyle, EventType } from "@notifee/react-native";
import * as Application from "expo-application";
import * as Device from "expo-device";

import type { AuthUser } from "@/services/auth";
import { postTokenToDatabase } from "@/services/ApiServices";

/** Android channel for app notifications. Send this as `channelId` from the backend. */
export const NOTIFICATION_CHANNEL_ID = "esllims_default";

let currentUser: AuthUser | null = null;
let initialized = false;
let unsubscribers: (() => void)[] = [];

export const setCurrentUserForNotifications = (user: AuthUser | null) => {
  currentUser = user;
};

const getDeviceId = async () => {
  if (Platform.OS === "android") return Application.getAndroidId();
  if (Platform.OS === "ios") return (await Application.getIosIdForVendorAsync()) ?? "unknown";
  return "unknown";
};

/**
 * Asks for permission, registers the device's FCM token with the backend for
 * the current user, and shows notifications that arrive while the app is open.
 * Call after login (or after a saved session is restored).
 */
export const initializeNotifications = async () => {
  if (!currentUser) {
    console.log("Skipping notification init: user not logged in");
    return;
  }
  if (initialized) return;

  if (Platform.OS === "web" || !Device.isDevice) {
    console.log("Push notifications need a physical Android or iOS device");
    return;
  }

  initialized = true;
  const messaging = getMessaging();

  // Covers iOS and Android 13+ (Firebase's own requestPermission is deprecated).
  await notifee.requestPermission();

  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: "ESL LIMS Notifications",
    importance: AndroidImportance.HIGH,
  });

  const deviceId = await getDeviceId();

  // Always register on init so the backend links this device's token to the
  // user who just logged in, even if the token itself hasn't changed.
  const token = await getToken(messaging);
  if (token) await sendTokenToBackend(token, deviceId);

  unsubscribers.push(
    onTokenRefresh(messaging, (newToken: string) => sendTokenToBackend(newToken, deviceId)),

    // FCM doesn't display notifications while the app is in the foreground,
    // so show them with Notifee.
    onMessage(messaging, async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? String(remoteMessage.data?.title ?? "");
      const body = remoteMessage.notification?.body ?? String(remoteMessage.data?.body ?? "");

      await notifee.displayNotification({
        title,
        body,
        data: remoteMessage.data as Record<string, string> | undefined,
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          pressAction: { id: "default", launchActivity: "default" },
          style: { type: AndroidStyle.BIGTEXT, text: body },
        },
      });
    }),

    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        // TODO: navigate based on detail.notification?.data
        console.log("Notification pressed", detail.notification?.data);
      }
    })
  );

  console.log("Notifications initialized");
};

const sendTokenToBackend = async (token: string, deviceId: string) => {
  if (!currentUser) return;

  try {
    await postTokenToDatabase({
      deviceId,
      firebaseToken: token,
      userlog: currentUser.userName,
      loggedBy: currentUser.userName,
      lastLoginBy: currentUser.userName,
      status: 0,
    });
    console.log("FCM token saved");
  } catch (error) {
    console.warn("FCM token save failed:", error);
  }
};

/** Stop listening and drop this device's token. Call on logout. */
export const resetNotificationService = async () => {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
  currentUser = null;

  if (!initialized) return;
  initialized = false;
  // Deleting the token means the next login gets a fresh one, so the backend
  // can't keep pushing to this device for the user who logged out.
  await deleteToken(getMessaging());
};
