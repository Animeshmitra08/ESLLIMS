import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { saveAndDisplay } from "@/services/notificationHandlers";
import type { TrnSampleTypes } from "@/types/DataTypes";
import { trnSampleDate } from "@/utils/samples";

/**
 * Notifies the user about new samples from TrnSampledata.
 *
 * Two callers pass each fetched list to checkForNewSamples:
 *   - HierarchyProvider, every minute while the app is open;
 *   - the background task (sampleBackgroundTask.ts), every 15+ minutes while
 *     it isn't.
 *
 * Both share a marker saved on the device: the latest registration time seen
 * and the IDs registered at exactly that time. Anything registered later is
 * new. The first check for a company only sets the marker, so a fresh login
 * doesn't announce the whole history; after that, samples registered while
 * the app was closed are announced on the next check.
 */

/** How often to re-fetch the samples while the app is in the foreground. */
export const SAMPLE_POLL_INTERVAL_MS = 60_000;

/** Above this many new samples at once, show one summary notification instead. */
const MAX_INDIVIDUAL_NOTIFICATIONS = 3;

/** `type` in the notification's data, so taps can be told apart from FCM ones. */
export const NEW_SAMPLE_NOTIFICATION_TYPE = "new_sample";

/** Looks up a lab (SBU) name by Id; undefined if it isn't known. */
export type LabNameLookup = (labId: string) => string | undefined;

// ─── Saved marker ─────────────────────────────────────────────────────────────

type Marker = {
  companyId: string;
  /** Latest registration time seen (ISO text, so text order is time order). */
  latest: string;
  /** IDs registered at exactly `latest`, to tell them from later ones. */
  idsAtLatest: string[];
};

const MARKER_KEY = "esllims.samples.marker";
const LAB_NAMES_KEY = "esllims.samples.labNames";

// Readable by the background task on a locked iPhone.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

// SecureStore has no web implementation; on web the marker lives in memory.
const isSupported = Platform.OS !== "web";
let memoryMarker: Marker | null = null;

const readMarker = async (): Promise<Marker | null> => {
  if (!isSupported) return memoryMarker;
  try {
    const json = await SecureStore.getItemAsync(MARKER_KEY, OPTIONS);
    return json ? (JSON.parse(json) as Marker) : null;
  } catch {
    return null;
  }
};

const writeMarker = async (marker: Marker) => {
  memoryMarker = marker;
  if (isSupported) await SecureStore.setItemAsync(MARKER_KEY, JSON.stringify(marker), OPTIONS);
};

/** Forget the marker and saved lab names. Call on logout. */
export const resetSampleWatcher = async () => {
  memoryMarker = null;
  if (!isSupported) return;
  await Promise.all([
    SecureStore.deleteItemAsync(MARKER_KEY, OPTIONS),
    SecureStore.deleteItemAsync(LAB_NAMES_KEY, OPTIONS),
  ]);
};

// ─── Lab names for the background task ───────────────────────────────────────

/**
 * Save lab names (SBU Id → Name) so the background task, which has no React
 * state, can still name the lab in its notifications.
 */
export const saveLabNames = async (labs: { Id: string; Name: string }[]) => {
  if (!isSupported || !labs.length) return;
  const names = Object.fromEntries(labs.map((lab) => [lab.Id, lab.Name]));
  await SecureStore.setItemAsync(LAB_NAMES_KEY, JSON.stringify(names), OPTIONS);
};

export const loadLabNameLookup = async (): Promise<LabNameLookup> => {
  if (!isSupported) return () => undefined;
  try {
    const json = await SecureStore.getItemAsync(LAB_NAMES_KEY, OPTIONS);
    const names = json ? (JSON.parse(json) as Record<string, string>) : {};
    return (labId) => names[labId];
  } catch {
    return () => undefined;
  }
};

// ─── Notifying ────────────────────────────────────────────────────────────────

// SecureStore keys (used for the notification ID) only allow these characters.
const toSafeKey = (value: string) => value.replace(/[^A-Za-z0-9._-]/g, "");

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
      // The ID is the sample's, so the same sample is never shown twice even
      // if the app and the background task both see it.
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

// ─── Checking ─────────────────────────────────────────────────────────────────

/** The marker for a list: its latest registration time and the IDs at it. */
const markerFor = (companyId: string, samples: TrnSampleTypes[], from?: Marker): Marker => {
  let latest = from?.latest ?? "";
  let ids = new Set(from?.idsAtLatest ?? []);
  for (const sample of samples) {
    const date = trnSampleDate(sample);
    if (date > latest) {
      latest = date;
      ids = new Set([sample.Id]);
    } else if (date === latest) {
      ids.add(sample.Id);
    }
  }
  return { companyId, latest, idsAtLatest: [...ids] };
};

// One check at a time, so overlapping checks can't announce a sample twice.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Compare the latest sample list with the saved marker and notify about
 * samples registered since. Resolves to the new samples.
 */
export const checkForNewSamples = (
  companyId: string,
  samples: TrnSampleTypes[],
  labName: LabNameLookup = () => undefined
): Promise<TrnSampleTypes[]> => {
  const run = queue.then(async () => {
    // Samples without an Id or registration time can't be tracked.
    const dated = samples.filter((sample) => sample.Id && trnSampleDate(sample));
    const marker = await readMarker();

    if (!marker || marker.companyId !== companyId) {
      // An empty list may be a failed or odd response; wait for real data
      // before setting the marker, so the next good response doesn't
      // announce everything.
      if (dated.length) await writeMarker(markerFor(companyId, dated));
      return [];
    }

    const seenAtLatest = new Set(marker.idsAtLatest);
    const fresh = dated.filter((sample) => {
      const date = trnSampleDate(sample);
      return date > marker.latest || (date === marker.latest && !seenAtLatest.has(sample.Id));
    });
    if (!fresh.length) return [];

    await writeMarker(markerFor(companyId, fresh, marker));
    // Notifee has no web implementation.
    if (Platform.OS !== "web") await notifyNewSamples(fresh, labName);
    return fresh;
  });
  queue = run.catch(() => {});
  return run;
};
