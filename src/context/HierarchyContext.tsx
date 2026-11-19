import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { fetchLims } from "@/services/ApiServices";
import {
  checkForNewSamples,
  resetSampleWatcher,
  SAMPLE_POLL_INTERVAL_MS,
} from "@/services/sampleNotificationService";
import type { LocationTypes, PlantTypes, SBUTypes, TrnSampleTypes } from "@/types/DataTypes";
import { toTrnSampleList } from "@/utils/samples";

/** The first level of the hierarchy that came back empty. */
export type HierarchyMissing = "location" | "plant" | "lab";

type HierarchyContextValue = {
  location: LocationTypes | null;
  plants: PlantTypes[];
  /** The plant whose SBUs are loaded; defaults to the first plant. */
  selectedPlant: PlantTypes | null;
  selectPlant: (plantId: string) => void;
  sbus: SBUTypes[];
  /** Registered samples from TrnSampledata, refreshed while the app is open. */
  allSamples: TrnSampleTypes[];
  /** True until the first TrnSampledata response (or failure). */
  samplesLoading: boolean;
  /** Re-fetch the samples now (e.g. pull to refresh). */
  refreshSamples: () => Promise<void>;
  /** True until every level down to the SBUs has loaded or come back empty. */
  loading: boolean;
  missing: HierarchyMissing | null;
};

const HierarchyContext = createContext<HierarchyContextValue | null>(null);

// A failed call or an unexpected response counts as no data.
const asList = <T,>(res: unknown): T[] => (Array.isArray(res) ? res : []);

/**
 * Loads the company's hierarchy one level at a time:
 * company -> LocationAct -> PlantAct -> SBUMasterACT. Each level reloads when
 * the one above it changes, and everything clears on logout.
 */
export function HierarchyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const companyId = user?.companyId;
  // undefined while loading, null when there is no location.
  const [location, setLocation] = useState<LocationTypes | null | undefined>(undefined);
  // null while loading.
  const [plants, setPlants] = useState<PlantTypes[] | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  // null while loading.
  const [sbus, setSbus] = useState<SBUTypes[] | null>(null);
  // null while loading.
  const [allSamples, setAllSamples] = useState<TrnSampleTypes[] | null>(null);
  // The current company's sample loader, so screens can trigger a refresh.
  const loadSamplesRef = useRef<(() => Promise<void>) | null>(null);
  const refreshSamples = useCallback(
    () => loadSamplesRef.current?.() ?? Promise.resolve(),
    []
  );

  // Each cleanup drops the late response and the old data, so switching user
  // or logging out never shows the previous company's hierarchy.
  useEffect(() => {
    if (!companyId) return;
    let active = true;
    fetchLims<unknown>("LocationAct", { CompanyId: companyId })
      // LocationAct always returns a single location wrapped in an array.
      .then((res) => {
        if (active) setLocation(asList<LocationTypes>(res)[0] ?? null);
      })
      .catch((e) => {
        console.warn("LocationAct failed", e);
        if (active) setLocation(null);
      });
    return () => {
      active = false;
      setLocation(undefined);
    };
  }, [companyId]);

  const locationId = location?.ID;

  useEffect(() => {
    if (!locationId) return;
    let active = true;
    fetchLims<unknown>("PlantAct", { LocationId: locationId })
      .then((res) => {
        if (active) setPlants(asList<PlantTypes>(res));
      })
      .catch((e) => {
        console.warn("PlantAct failed", e);
        if (active) setPlants([]);
      });
    return () => {
      active = false;
      setPlants(null);
    };
  }, [locationId]);

  // Falls back to the first plant when nothing is picked or the picked plant
  // isn't in the current list.
  const plantList = plants ?? [];
  const selectedPlant =
    plantList.find((plant) => plant.ID === selectedPlantId) ?? plantList[0] ?? null;
  const plantId = selectedPlant?.ID;

  useEffect(() => {
    if (!plantId) return;
    let active = true;
    fetchLims<unknown>("SBUMasterACT", { PlantId: plantId })
      .then((res) => {
        if (active) setSbus(asList<SBUTypes>(res));
      })
      .catch((e) => {
        console.warn("SBUMasterACT failed", e);
        if (active) setSbus([]);
      });
    return () => {
      active = false;
      setSbus(null);
    };
  }, [plantId]);

  // Lab names for new-sample notifications, read by the polling loop below
  // without restarting it whenever the SBUs change.
  const sbusRef = useRef<SBUTypes[]>([]);
  useEffect(() => {
    sbusRef.current = sbus ?? [];
  }, [sbus]);

  // Every sample (TrnSampledata takes an empty body). Waits for login so the
  // request carries the auth token, and reloads when the user changes.
  // While the app is open it re-fetches on a timer and on returning to the
  // foreground, and new samples trigger a notification.
  useEffect(() => {
    if (!companyId) return;
    let active = true;
    let inFlight = false;
    resetSampleWatcher();

    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetchLims<unknown>("TrnSampledata", {});
        if (!active) return;
        const samples = toTrnSampleList(res, "TrnSampledata");
        setAllSamples(samples);
        checkForNewSamples(samples, (labId) =>
          sbusRef.current.find((sbu) => sbu.Id === labId)?.Name
        );
      } catch (e) {
        console.warn("TrnSampledata failed", e);
        // Keep the last good list if a refresh fails.
        if (active) setAllSamples((previous) => previous ?? []);
      } finally {
        inFlight = false;
      }
    };

    loadSamplesRef.current = load;
    load();
    const interval = setInterval(() => {
      if (AppState.currentState === "active") load();
    }, SAMPLE_POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") load();
    });

    return () => {
      active = false;
      if (loadSamplesRef.current === load) loadSamplesRef.current = null;
      clearInterval(interval);
      subscription.remove();
      resetSampleWatcher();
      setAllSamples(null);
    };
  }, [companyId]);

  // console.log(allSamples);
  

  // Walk down the levels: stop at the first one still loading or empty.
  let loading = false;
  let missing: HierarchyMissing | null = null;
  if (companyId) {
    if (location === undefined) loading = true;
    else if (location === null) missing = "location";
    else if (plants === null) loading = true;
    else if (plants.length === 0) missing = "plant";
    else if (sbus === null) loading = true;
    else if (sbus.length === 0) missing = "lab";
  }

  return (
    <HierarchyContext.Provider
      value={{
        location: location ?? null,
        plants: plantList,
        selectedPlant,
        selectPlant: setSelectedPlantId,
        sbus: sbus ?? [],
        allSamples: allSamples ?? [],
        samplesLoading: !!companyId && allSamples === null,
        refreshSamples,
        loading,
        missing,
      }}
    >
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const context = useContext(HierarchyContext);
  if (!context)
    throw new Error("useHierarchy must be used inside HierarchyProvider");
  return context;
}
