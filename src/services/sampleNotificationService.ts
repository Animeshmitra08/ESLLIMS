import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { saveAndDisplay } from "@/services/notificationHandlers";
import type { TrnSampleTypes } from "@/types/DataTypes";
import { trnSampleDate, visibleParams } from "@/utils/samples";

/**
 * Notifies the user when a sample from TrnSampledata reaches a step:
 * registered, received, analysed or published.
 *
 * Two callers pass each fetched list to checkForNewSamples:
 *   - HierarchyProvider, every minute while the app is open;
 *   - the background task (sampleBackgroundTask.ts), every 15+ minutes while
 *     it isn't.
 *
 * Both share a marker saved on the device holding, for each step, the latest
 * time seen in that step's field (RegisteredOn, ReceivedOn, AnalystOn,
 * PublishedOn) and the IDs at exactly that time. A sample whose field is
 * later is new for that step. Each step is compared only with itself, since
 * the API doesn't send every field in the same time zone. The first check for
 * a company (or for a step) only sets the marker, so a fresh login doesn't
 * announce the whole history; after that, steps reached while the app was
 * closed are announced on the next check.
 */

/** How often to re-fetch the samples while the app is in the foreground. */
export const SAMPLE_POLL_INTERVAL_MS = 60_000;

/** Above this many new events at once, show one summary notification instead. */
const MAX_INDIVIDUAL_NOTIFICATIONS = 3;

/** `type` in the notification's data, so taps can be told apart from FCM ones. */
export const NEW_SAMPLE_NOTIFICATION_TYPE = "new_sample";

/** Looks up a lab (SBU) name by Id; undefined if it isn't known. */
export type LabNameLookup = (labId: string) => string | undefined;

// ─── Steps ────────────────────────────────────────────────────────────────────

type Stage = "registered" | "received" | "analysed" | "published";

const STAGES: {
  stage: Stage;
  /** Notification title. */
  title: string;
  /** When the sample reached the step ("" if it hasn't). */
  on: (sample: TrnSampleTypes) => string;
  by: (sample: TrnSampleTypes) => string;
}[] = [
  {
    stage: "registered",
    title: "Sample registered",
    on: trnSampleDate,
    by: (s) => s.RegisteredBy,
  },
  { stage: "received", title: "Sample received", on: (s) => s.ReceivedOn, by: (s) => s.ReceivedBy },
  { stage: "analysed", title: "Sample analysed", on: (s) => s.AnalystOn, by: (s) => s.AnalystBy },
  {
    stage: "published",
    title: "Sample published",
    on: (s) => s.PublishedOn,
    by: (s) => s.PublishedBy,
  },
];

/** A sample reaching a step. */
export type SampleEvent = { sample: TrnSampleTypes; stage: (typeof STAGES)[number] };

// ─── Saved marker ─────────────────────────────────────────────────────────────

type StageMarker = {
  /** Latest time seen for the step (ISO text, so text order is time order). */
  latest: string;
  /** IDs at exactly `latest`, to tell them from later ones. */
  idsAtLatest: string[];
};

type Marker = {
  companyId: string;
  /** A missing step hasn't been checked yet; its first check is silent. */
  stages: Partial<Record<Stage, StageMarker>>;
};

/** Accepts the older shape, which tracked registration only. */
const upgradeMarker = (saved: unknown): Marker | null => {
  if (!saved || typeof saved !== "object") return null;
  const m = saved as Partial<Marker> & Partial<StageMarker>;
  if (typeof m.companyId !== "string") return null;
  if (m.stages) return { companyId: m.companyId, stages: m.stages };
  return {
    companyId: m.companyId,
    stages:
      typeof m.latest === "string"
        ? { registered: { latest: m.latest, idsAtLatest: m.idsAtLatest ?? [] } }
        : {},
  };
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
    return json ? upgradeMarker(JSON.parse(json)) : null;
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

/** One line per parameter in Data: "pH: 7.2" / "Moisture: 12.5 %" / "Ash: —". */
const describeParams = (sample: TrnSampleTypes) =>
  visibleParams(sample.Data ?? [])
    .filter((p) => p.Param)
    .map((p) => {
      const hasValue = p.Value !== null && p.Value !== undefined && String(p.Value) !== "";
      const value = hasValue ? [String(p.Value), p.Uom].filter(Boolean).join(" ") : "—";
      return `${p.Param}: ${value}`;
    });

/** "Sample received by ESL ADMIN" */
const titleFor = ({ sample, stage }: SampleEvent) => {
  const by = stage.by(sample);
  return by ? `${stage.title} by ${by}` : stage.title;
};

const notifyEvents = async (events: SampleEvent[], labName: LabNameLookup) => {
  if (events.length <= MAX_INDIVIDUAL_NOTIFICATIONS) {
    for (const event of events) {
      const { sample, stage } = event;
      // The ID is the sample's and the step's, so the same step is never shown
      // twice even if the app and the background task both see it.
      await saveAndDisplay({
        id: `sample_${toSafeKey(sample.Id)}_${stage.stage}`,
        title: titleFor(event),
        body: [describeSample(sample, labName), ...describeParams(sample)].join("\n"),
        data: {
          type: NEW_SAMPLE_NOTIFICATION_TYPE,
          sampleId: sample.Id,
          stage: stage.stage,
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
    title: `${events.length} sample updates`,
    body: events
      .map(({ sample, stage }) => `${stage.title}: ${describeSample(sample, labName)}`)
      .join("\n"),
    data: { type: NEW_SAMPLE_NOTIFICATION_TYPE, count: String(events.length) },
    receivedAt: now,
    read: false,
  });
};

// ─── Checking ─────────────────────────────────────────────────────────────────

/** A step's marker after seeing these times (sample Id → time). */
const advance = (dates: [id: string, date: string][], from?: StageMarker): StageMarker => {
  let latest = from?.latest ?? "";
  let ids = new Set(from?.idsAtLatest ?? []);
  for (const [id, date] of dates) {
    if (date > latest) {
      latest = date;
      ids = new Set([id]);
    } else if (date === latest) {
      ids.add(id);
    }
  }
  return { latest, idsAtLatest: [...ids] };
};

// One check at a time, so overlapping checks can't announce a step twice.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Compare the latest sample list with the saved marker and notify about
 * samples registered, received, analysed or published since. Resolves to the
 * new events.
 */
export const checkForNewSamples = (
  companyId: string,
  samples: TrnSampleTypes[],
  labName: LabNameLookup = () => undefined
): Promise<SampleEvent[]> => {
  const run = queue.then(async () => {
    const tracked = samples.filter((sample) => sample.Id);
    const saved = await readMarker();
    const sameCompany = saved?.companyId === companyId;

    // An empty list may be a failed or odd response; wait for real data
    // before setting the marker, so the next good response doesn't announce
    // everything.
    if (!tracked.some(trnSampleDate)) return [];

    const marker: Marker = { companyId, stages: {} };
    const fresh: SampleEvent[] = [];
    let newStage = false;

    for (const stage of STAGES) {
      const dates = tracked
        .map((sample) => [sample, stage.on(sample)] as const)
        .filter(([, date]) => date);
      const previous = sameCompany ? saved?.stages[stage.stage] : undefined;

      if (previous) {
        const seenAtLatest = new Set(previous.idsAtLatest);
        for (const [sample, date] of dates) {
          if (date > previous.latest || (date === previous.latest && !seenAtLatest.has(sample.Id)))
            fresh.push({ sample, stage });
        }
      } else {
        newStage = true;
      }
      // Without a previous marker the step is just recorded, not announced.
      marker.stages[stage.stage] = advance(
        dates.map(([sample, date]) => [sample.Id, date]),
        previous
      );
    }

    if (!fresh.length && !newStage) return [];
    await writeMarker(marker);
    // Notifee has no web implementation.
    if (fresh.length && Platform.OS !== "web") await notifyEvents(fresh, labName);
    return fresh;
  });
  queue = run.catch(() => {});
  return run;
};
