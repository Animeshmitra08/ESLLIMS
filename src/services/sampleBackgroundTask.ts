import { Platform } from "react-native";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { fetchLims, setAuthToken } from "@/services/ApiServices";
import { isTokenExpired } from "@/services/auth";
import { checkForNewSamples, loadLabNameLookup } from "@/services/sampleNotificationService";
import { loadSession } from "@/services/session";
import { toTrnSampleList } from "@/utils/samples";

/**
 * Checks for new samples while the app is in the background or closed, and
 * notifies about them like the in-app check does.
 *
 * The OS decides when this runs: at least 15 minutes apart, only with network
 * and enough battery, and on iOS often much less often. It stops if the user
 * force-quits the app (swiping it away on iOS). For instant alerts the backend
 * should send an FCM push when a sample is registered.
 *
 * The task must be defined before the app loads, so this file is imported from
 * index.ts; it has no React state, so it reads the session from storage.
 */

export const SAMPLE_BACKGROUND_TASK = "esllims-new-samples";

/** Minutes between runs; 15 is the shortest the OS allows. */
const MINIMUM_INTERVAL_MINUTES = 15;

const isSupported = Platform.OS === "android" || Platform.OS === "ios";

if (isSupported) {
  TaskManager.defineTask(SAMPLE_BACKGROUND_TASK, async () => {
    try {
      const session = await loadSession();
      // Logged out or expired: nothing to check until the user logs in again.
      if (!session || isTokenExpired(session.tokenExpiry)) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }
      setAuthToken(session.token);

      const res = await fetchLims<unknown>("TrnSampledata", {});
      const samples = toTrnSampleList(res, "TrnSampledata");
      await checkForNewSamples(session.user.companyId, samples, await loadLabNameLookup());
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (e) {
      console.warn("Background sample check failed", e);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Start the periodic background check. Call after login (or session restore). */
export const registerSampleBackgroundTask = async () => {
  if (!isSupported) return;
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
    console.log("Background tasks are not available on this device");
    return;
  }
  if (await TaskManager.isTaskRegisteredAsync(SAMPLE_BACKGROUND_TASK)) return;
  await BackgroundTask.registerTaskAsync(SAMPLE_BACKGROUND_TASK, {
    minimumInterval: MINIMUM_INTERVAL_MINUTES,
  });
};

/** Stop the background check. Call on logout. */
export const unregisterSampleBackgroundTask = async () => {
  if (!isSupported) return;
  if (await TaskManager.isTaskRegisteredAsync(SAMPLE_BACKGROUND_TASK)) {
    await BackgroundTask.unregisterTaskAsync(SAMPLE_BACKGROUND_TASK);
  }
};
