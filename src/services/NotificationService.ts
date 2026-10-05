import { Platform } from "react-native";
import {
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from "@react-native-firebase/messaging";
import notifee, { EventType } from "@notifee/react-native";
import { isAxiosError } from "axios";
import * as Application from "expo-application";
import * as Device from "expo-device";

import type { AuthUser } from "@/services/auth";
import { postTokenToDatabase } from "@/services/ApiServices";
import {
  ensureNotificationChannel,
  fromRemoteMessage,
  openNotifeeNotification,
  openRemoteMessage,
  saveAndDisplay,
} from "@/services/notificationHandlers";

export { NOTIFICATION_CHANNEL_ID } from "@/services/notificationHandlers";

let currentUser: AuthUser | null = null;
let initialized = false;
let checkedInitialNotification = false;
let unsubscribers: (() => void)[] = [];

export const setCurrentUserForNotifications = (user: AuthUser | null) => {
  currentUser = user;
};

const getDeviceId = async () => {
  if (Platform.OS === "android") return Application.getAndroidId();
  if (Platform.OS === "ios") return (await Application.getIosIdForVendorAsync()) ?? "unknown";
  return "unknown";
};

/** If the app was launched by tapping a notification, open it. Runs once per launch. */
const handleLaunchNotification = async () => {
  if (checkedInitialNotification) return;
  checkedInitialNotification = true;

  // Displayed by Android/iOS from an FCM notification payload.
  const remote = await getInitialNotification(getMessaging());
  if (remote) {
    await openRemoteMessage(remote);
    return;
  }
  // Displayed by Notifee (data-only messages).
  const local = await notifee.getInitialNotification();
  if (local) openNotifeeNotification(local.notification);
};

/**
 * Asks for permission, saves and shows notifications that arrive while the
 * app is open, handles taps, and registers the device's FCM token with the
 * backend for the current user. Call after login (or session restore).
 *
 * Background and closed-app messages are handled in backgroundNotifications.ts.
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

  // Listeners and the launch check come first so they don't wait on the
  // permission prompt or the network call below.
  unsubscribers.push(
    // FCM doesn't display notifications while the app is in the foreground,
    // so save them and show them with Notifee.
    onMessage(messaging, (message) =>
      saveAndDisplay(fromRemoteMessage(message)).catch((e) =>
        console.warn("Failed to handle foreground notification", e)
      )
    ),

    // Tap on a system-displayed notification while the app was in the background.
    onNotificationOpenedApp(messaging, (message) => {
      openRemoteMessage(message).catch((e) => console.warn("Failed to open notification", e));
    }),

    // Tap on a Notifee notification while the app is open.
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        openNotifeeNotification(detail.notification);
      }
    })
  );

  await handleLaunchNotification().catch((e) =>
    console.warn("Failed to check launch notification", e)
  );

  // Covers iOS and Android 13+ (Firebase's own requestPermission is deprecated).
  await notifee.requestPermission();
  await ensureNotificationChannel();

  const deviceId = await getDeviceId();

  // Always register on init so the backend links this device's token to the
  // user who just logged in, even if the token itself hasn't changed.
  unsubscribers.push(
    onTokenRefresh(messaging, (newToken: string) => sendTokenToBackend(newToken, deviceId))
  );
  const token = await getToken(messaging);
  if (token) await sendTokenToBackend(token, deviceId);

  console.log("Notifications initialized");
};

const sendTokenToBackend = async (token: string, deviceId: string) => {
  if (!currentUser) return;

  // userlog carries the user's details as a JSON string, e.g.
  // {"USER_NAME":"104041","ROLE_NAME":"ANALYST"}
  const userlog = JSON.stringify({
    USER_NAME: currentUser.userName,
    ROLE_NAME: currentUser.role,
  });

  const payload = {
    deviceId,
    firebaseToken: token,
    userlog,
    loggedBy: currentUser.userName,
    lastLoginBy: currentUser.userName,
    status: 0
  }

  console.log(payload);
  

  try {
    await postTokenToDatabase(payload);
    console.log("FCM token saved", payload);
  } catch (error) {
    // Axios errors with no response (connection failed or timed out) only say
    // "Network Error"; include the code and URL so the cause is traceable.
    const detail = isAxiosError(error)
      ? `${error.code ?? ""} ${error.message} → ${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`
      : error;
    console.warn("FCM token save failed:", detail);
  }
};

/** Stop listening and drop this device's token. Call on logout. */
export const resetNotificationService = async () => {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
  currentUser = null;

  if (!initialized) return;
  initialized = false;
  await notifee.cancelAllNotifications();
  // Deleting the token means the next login gets a fresh one, so the backend
  // can't keep pushing to this device for the user who logged out.
  await deleteToken(getMessaging());
};
