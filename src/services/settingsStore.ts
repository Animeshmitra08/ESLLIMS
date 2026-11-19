import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type AppSettings = {
  /** Show notifications on screen. They're still saved to the list when off. */
  notifications: boolean;
  sound: boolean;
  /** Android only; on iOS vibration follows the system settings. */
  vibrate: boolean;
};

/**
 * Device-wide app settings, persisted in SecureStore. They stay on the device
 * after logout. Usable outside React (e.g. the background message handler),
 * so reads go through ensureSettingsLoaded.
 */

const SETTINGS_KEY = "esllims.settings";

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  sound: true,
  vibrate: true,
};

// Readable in the background on a locked iPhone, like the notification list.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

// SecureStore has no web implementation; on web settings live in memory only.
const isSupported = Platform.OS !== "web";

let settings: AppSettings = DEFAULT_SETTINGS;
let loading: Promise<AppSettings> | null = null;
const listeners = new Set<() => void>();

const setSettings = (next: AppSettings) => {
  settings = next;
  listeners.forEach((listener) => listener());
};

export const subscribeSettings = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getSettingsSnapshot = () => settings;

const readSettings = async (): Promise<AppSettings> => {
  if (!isSupported) return settings;
  try {
    const json = await SecureStore.getItemAsync(SETTINGS_KEY, OPTIONS);
    const saved = json ? JSON.parse(json) : {};
    // Fill in settings added since they were saved.
    return { ...DEFAULT_SETTINGS, ...(typeof saved === "object" && saved ? saved : {}) };
  } catch (e) {
    console.warn("Failed to read settings", e);
    return DEFAULT_SETTINGS;
  }
};

/** Load the saved settings once; later calls return the same result. */
export const ensureSettingsLoaded = () => {
  loading ??= readSettings().then((loaded) => {
    setSettings(loaded);
    return loaded;
  });
  return loading;
};

export const updateSettings = async (changes: Partial<AppSettings>) => {
  await ensureSettingsLoaded();
  const next = { ...settings, ...changes };
  setSettings(next);
  if (isSupported) await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(next), OPTIONS);
};
