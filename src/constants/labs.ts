import type { SymbolViewProps } from "expo-symbols";

import { categoryColors } from "@/constants/colors";
import type { SBUTypes } from "@/types/DataTypes";

export type Lab = {
  /** The SBU's Id, used in the URL: /lab/<id> */
  id: string;
  name: string;
  icon: SymbolViewProps["name"];
  color: (typeof categoryColors)[keyof typeof categoryColors];
};

type LabStyle = Pick<Lab, "icon" | "color">;

// Icons and colors for the labs we know by name. Any other SBU falls back to
// the default icon and a color picked by its position in the list.
const KNOWN_LAB_STYLES: Record<string, LabStyle> = {
  "CENTRAL LAB": {
    icon: { ios: "flask.fill", android: "science", web: "science" },
    color: categoryColors.blue,
  },
  "DIP LAB": {
    icon: { ios: "spigot.fill", android: "plumbing", web: "plumbing" },
    color: categoryColors.violet,
  },
  "SMS LAB": {
    icon: {
      ios: "flame.fill",
      android: "local_fire_department",
      web: "local_fire_department",
    },
    color: categoryColors.orange,
  },
  "WRM LAB": {
    icon: { ios: "cable.connector", android: "cable", web: "cable" },
    color: categoryColors.emerald,
  },
  "BRM LAB": {
    icon: { ios: "square.stack.3d.up.fill", android: "layers", web: "layers" },
    color: categoryColors.amber,
  },
  "WIP LAB": {
    icon: { ios: "gearshape.2.fill", android: "settings", web: "settings" },
    color: categoryColors.teal,
  },
};

const DEFAULT_ICON: SymbolViewProps["name"] = {
  ios: "flask.fill",
  android: "science",
  web: "science",
};

const FALLBACK_COLORS = Object.values(categoryColors);

/** Builds a lab tile from an SBU; `index` is its position in the SBU list. */
export const toLab = (sbu: SBUTypes, index: number): Lab => {
  const known = KNOWN_LAB_STYLES[sbu.Name.trim().toUpperCase()];
  return {
    id: sbu.Id,
    name: sbu.Name,
    icon: known?.icon ?? DEFAULT_ICON,
    color: known?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  };
};
