import { useEffect, useSyncExternalStore } from "react";

import {
  ensureSettingsLoaded,
  getSettingsSnapshot,
  subscribeSettings,
} from "@/services/settingsStore";

/** The app settings; updates live. Change them with updateSettings. */
export function useSettings() {
  useEffect(() => {
    ensureSettingsLoaded().catch((e) => console.warn("Failed to load settings", e));
  }, []);
  return useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getSettingsSnapshot);
}
