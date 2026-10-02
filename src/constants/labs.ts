import type { SymbolViewProps } from "expo-symbols";

import { categoryColors } from "@/constants/colors";

export type Lab = {
  /** Used in the URL: /lab/<id> */
  id: string;
  /** Matches the lab_Location values in jsondata/UserRole.json. */
  name: string;
  icon: SymbolViewProps["name"];
  color: (typeof categoryColors)[keyof typeof categoryColors];
};

export const LABS: Lab[] = [
  {
    id: "central",
    name: "CENTRAL LAB",
    icon: { ios: "flask.fill", android: "science", web: "science" },
    color: categoryColors.blue,
  },
  {
    id: "dip",
    name: "DIP LAB",
    icon: { ios: "spigot.fill", android: "plumbing", web: "plumbing" },
    color: categoryColors.violet,
  },
  {
    id: "sms",
    name: "SMS LAB",
    icon: {
      ios: "flame.fill",
      android: "local_fire_department",
      web: "local_fire_department",
    },
    color: categoryColors.orange,
  },
  {
    id: "wrm",
    name: "WRM LAB",
    icon: { ios: "cable.connector", android: "cable", web: "cable" },
    color: categoryColors.emerald,
  },
  {
    id: "brm",
    name: "BRM LAB",
    icon: { ios: "square.stack.3d.up.fill", android: "layers", web: "layers" },
    color: categoryColors.amber,
  },
  {
    id: "wip",
    name: "WIP LAB",
    icon: { ios: "gearshape.2.fill", android: "settings", web: "settings" },
    color: categoryColors.teal,
  },
];

export const findLab = (id: string | undefined) => LABS.find((lab) => lab.id === id);
