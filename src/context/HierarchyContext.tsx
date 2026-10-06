import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { fetchLims } from "@/services/ApiServices";
import type { LocationTypes, PlantTypes, SBUTypes } from "@/types/DataTypes";

/** The first level of the hierarchy that came back empty. */
export type HierarchyMissing = "location" | "plant" | "lab";

type HierarchyContextValue = {
  location: LocationTypes | null;
  plants: PlantTypes[];
  /** The plant whose SBUs are loaded; defaults to the first plant. */
  selectedPlant: PlantTypes | null;
  selectPlant: (plantId: string) => void;
  sbus: SBUTypes[];
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
