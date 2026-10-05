import { Platform } from "react-native";
import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import notifee, { EventType } from "@notifee/react-native";

import { addNotification } from "@/services/notificationStore";
import {
  fromRemoteMessage,
  openNotifeeNotification,
  saveAndDisplay,
} from "@/services/notificationHandlers";

/**
 * Handlers for when the app is in the background or closed. They must be
 * registered before the app loads, so this file is imported from index.ts.
 */
if (Platform.OS !== "web") {
  setBackgroundMessageHandler(getMessaging(), async (message) => {
    const notification = fromRemoteMessage(message);
    if (message.notification) {
      // Android/iOS already displays messages with a notification payload.
      await addNotification(notification);
    } else {
      await saveAndDisplay(notification);
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      openNotifeeNotification(detail.notification);
    }
  });
}
