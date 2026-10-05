import notifee, {
  AndroidImportance,
  AndroidStyle,
  type Notification,
} from "@notifee/react-native";
import type { RemoteMessage } from "@react-native-firebase/messaging";

import {
  addNotification,
  setNotificationRead,
  type AppNotification,
} from "@/services/notificationStore";

/**
 * Logic shared by the in-app handlers (NotificationService) and the background
 * handlers (backgroundNotifications), which run before React has loaded.
 */

/** Android channel for app notifications. Send this as `channelId` from the backend. */
export const NOTIFICATION_CHANNEL_ID = "esllims_default";

/** Key in a Notifee notification's data that links it to the saved notification. */
const STORED_ID_KEY = "notificationId";

export const ensureNotificationChannel = () =>
  notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: "ESL LIMS Notifications",
    importance: AndroidImportance.HIGH,
  });

const toStringRecord = (data: Record<string, unknown> | undefined) => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    result[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return result;
};

// Short, stable ID (djb2 hash) so the same message gets the same ID whichever
// handler sees it first, and so the SecureStore index stays small.
const hashId = (input: string) => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
};

export const fromRemoteMessage = (message: RemoteMessage): AppNotification => {
  const data = toStringRecord(message.data);
  const title = message.notification?.title ?? data.title ?? "";
  const body = message.notification?.body ?? data.body ?? "";
  const sentTime = message.sentTime ?? Date.now();
  return {
    id: hashId(message.messageId ?? `${title}|${body}|${sentTime}`),
    title: title || "ESL LIMS",
    body,
    data,
    receivedAt: sentTime,
    read: false,
  };
};

/** Save the message and show it with Notifee (FCM doesn't show data-only messages). */
export const saveAndDisplay = async (notification: AppNotification) => {
  await addNotification(notification);
  await ensureNotificationChannel();
  await notifee.displayNotification({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    data: { ...notification.data, [STORED_ID_KEY]: notification.id },
    android: {
      channelId: NOTIFICATION_CHANNEL_ID,
      pressAction: { id: "default", launchActivity: "default" },
      style: { type: AndroidStyle.BIGTEXT, text: notification.body },
    },
  });
};

// ─── Opening a notification ──────────────────────────────────────────────────

export type OpenedNotification = { id: string; data: Record<string, string> };

let openListener: ((opened: OpenedNotification) => void) | null = null;
let pendingOpen: OpenedNotification | null = null;
let lastOpenedId: string | null = null;

/**
 * Called when the user taps a notification. Marks it read, then hands it to
 * the app's navigation, or holds it until the app is ready (after login).
 */
export const notifyOpened = (opened: OpenedNotification) => {
  // The same tap can be reported by more than one API (e.g. Notifee's
  // background event and getInitialNotification), so handle it once.
  if (opened.id === lastOpenedId) return;
  lastOpenedId = opened.id;

  setNotificationRead(opened.id, true).catch((e) =>
    console.warn("Failed to mark notification read", e)
  );
  if (openListener) openListener(opened);
  else pendingOpen = opened;
};

export const setNotificationOpenListener = (listener: (opened: OpenedNotification) => void) => {
  openListener = listener;
  if (pendingOpen) {
    const opened = pendingOpen;
    pendingOpen = null;
    listener(opened);
  }
  return () => {
    if (openListener === listener) openListener = null;
  };
};

/** Tap on a notification displayed by Android/iOS from an FCM notification payload. */
export const openRemoteMessage = async (message: RemoteMessage) => {
  const notification = fromRemoteMessage(message);
  // It may not be saved yet, e.g. on iOS where the background handler doesn't
  // run for notification messages.
  await addNotification(notification);
  notifyOpened({ id: notification.id, data: notification.data });
};

/** Tap on a notification displayed by Notifee. */
export const openNotifeeNotification = (notification: Notification | undefined) => {
  if (!notification) return;
  const data = toStringRecord(notification.data);
  const id = data[STORED_ID_KEY] ?? notification.id;
  if (!id) return;
  delete data[STORED_ID_KEY];
  notifyOpened({ id, data });
};
