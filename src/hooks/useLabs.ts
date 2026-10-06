import { toLab, type Lab } from "@/constants/labs";
import { useHierarchy } from "@/context/HierarchyContext";

/** The selected plant's SBUs, shown as labs. */
export function useLabs(): Lab[] {
  const { sbus } = useHierarchy();
  return sbus.map(toLab);
}

/** The lab for an SBU Id, or undefined if it isn't in the loaded SBUs. */
export function useLab(id: string | undefined): Lab | undefined {
  return useLabs().find((lab) => lab.id === id);
}
