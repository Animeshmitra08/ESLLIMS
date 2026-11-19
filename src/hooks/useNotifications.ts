import { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";

import {
  setNotificationOpenListener,
  type OpenedNotification,
} from "@/services/notificationHandlers";
import {
  getNotificationsSnapshot,
  loadNotifications,
  subscribeNotifications,
} from "@/services/notificationStore";
import { NEW_SAMPLE_NOTIFICATION_TYPE } from "@/services/sampleNotificationService";

/** Saved notifications (newest first) and the unread count; updates live. */
export function useNotifications() {
  const notifications = useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    getNotificationsSnapshot
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount };
}

/** The form a notification points to, from its data payload. */
export const getNotificationFormId = (data: Record<string, string>) =>
  data.formid ?? data.formId ?? data.FormId;

/**
 * Open what a notification points to. Returns false if it points nowhere.
 *   - a form → that form;
 *   - a sample (sample notifications) → the samples screen, showing it;
 *   - several samples (the summary notification) → the samples screen.
 */
export const openNotificationData = (data: Record<string, string>) => {
  const formid = getNotificationFormId(data);
  if (formid) {
    router.push({
      pathname: "/form/[formid]",
      params: data.lab ? { formid, lab: data.lab } : { formid },
    });
  } else if (data.type === NEW_SAMPLE_NOTIFICATION_TYPE) {
    router.push(data.sampleId ? { pathname: "/samples", params: { sampleId: data.sampleId } } : "/samples");
  } else {
    return false;
  }
  return true;
};

const openNotificationTarget = ({ data }: OpenedNotification) => {
  if (!openNotificationData(data)) router.push("/notifications");
};

/**
 * Keeps the saved list in sync and opens tapped notifications. Mount once,
 * in a layout that only renders while the user is logged in.
 */
export function useNotificationSync() {
  // Reload on start and whenever the app returns to the foreground, to pick
  // up notifications the background handler saved in the meantime.
  useEffect(() => {
    const reload = () =>
      loadNotifications().catch((e) => console.warn("Failed to load notifications", e));
    reload();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") reload();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => setNotificationOpenListener(openNotificationTarget), []);
}
