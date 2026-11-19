import { Platform } from "react-native";

import { saveAndDisplay } from "@/services/notificationHandlers";
import type { TrnSampleTypes } from "@/types/DataTypes";

/**
 * Notifies the user about new samples from TrnSampledata.
 *
 * HierarchyProvider re-fetches the sample list while the app is open and
 * passes every result to checkForNewSamples. The first non-empty list becomes
 * the baseline (nothing is announced); after that, any sample whose Id hasn't
 * been seen is shown as a notification and saved to the notification list,
 * like a push notification.
 *
 * Seen IDs are kept in memory only, so samples that arrived while the app was
 * closed become part of the next launch's baseline rather than notifying.
 */

/** How often to re-fetch the samples while the app is in the foreground. */
export const SAMPLE_POLL_INTERVAL_MS = 60_000;

/** Above this many new samples at once, show one summary notification instead. */
const MAX_INDIVIDUAL_NOTIFICATIONS = 3;

/** `type` in the notification's data, so taps can be told apart from FCM ones. */
export const NEW_SAMPLE_NOTIFICATION_TYPE = "new_sample";

// null until the baseline has been taken.
let knownIds: Set<string> | null = null;

/** Forget the seen samples. Call when the user (or company) changes. */
export const resetSampleWatcher = () => {
  knownIds = null;
};

// SecureStore keys (used for the notification ID) only allow these characters.
const toSafeKey = (value: string) => value.replace(/[^A-Za-z0-9._-]/g, "");

/** Looks up a lab (SBU) name by Id; undefined if it isn't loaded. */
export type LabNameLookup = (labId: string) => string | undefined;

/** "CLB2BG20261119002 · Central Lab · Shift A" */
const describeSample = (sample: TrnSampleTypes, labName: LabNameLookup) =>
  [
    sample.SampleCode || "Sample",
    sample.Dept_Id ? labName(sample.Dept_Id) : undefined,
    sample.Shift ? `Shift ${sample.Shift}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

const notifyNewSamples = async (samples: TrnSampleTypes[], labName: LabNameLookup) => {
  if (samples.length <= MAX_INDIVIDUAL_NOTIFICATIONS) {
    for (const sample of samples) {
      await saveAndDisplay({
        id: `sample_${toSafeKey(sample.Id)}`,
        title: "New sample registered",
        body: describeSample(sample, labName),
        data: {
          type: NEW_SAMPLE_NOTIFICATION_TYPE,
          sampleId: sample.Id,
          // The lab (SBU) the sample belongs to; tapping opens that lab.
          ...(sample.Dept_Id ? { labId: sample.Dept_Id } : {}),
        },
        receivedAt: Date.now(),
        read: false,
      });
    }
    return;
  }

  const now = Date.now();
  await saveAndDisplay({
    id: `samples_${now}`,
    title: `${samples.length} new samples registered`,
    body: samples.map((sample) => describeSample(sample, labName)).join("\n"),
    data: { type: NEW_SAMPLE_NOTIFICATION_TYPE, count: String(samples.length) },
    receivedAt: now,
    read: false,
  });
};

/**
 * Compare the latest sample list with the ones seen before and notify about
 * new ones. Returns the new samples.
 */
export const checkForNewSamples = (
  samples: TrnSampleTypes[],
  labName: LabNameLookup = () => undefined
): TrnSampleTypes[] => {
  const withId = samples.filter((sample) => typeof sample.Id === "string" && sample.Id);

  if (knownIds === null) {
    // An empty list may be a failed or odd response; wait for real data before
    // taking the baseline, so the next good response doesn't announce everything.
    if (withId.length) knownIds = new Set(withId.map((sample) => sample.Id));
    return [];
  }

  const seen = knownIds;
  const fresh = withId.filter((sample) => !seen.has(sample.Id));
  if (!fresh.length) return [];

  // IDs are only ever added, so a sample that briefly drops out of a response
  // isn't announced again when it comes back.
  fresh.forEach((sample) => seen.add(sample.Id));

  // Notifee has no web implementation.
  if (Platform.OS !== "web") {
    notifyNewSamples(fresh, labName).catch((e) => console.warn("Failed to show new-sample notification", e));
  }
  return fresh;
};
