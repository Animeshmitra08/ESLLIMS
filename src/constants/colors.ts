/**
 * ESL LIMS color palette (light mode only).
 *
 * `palette` holds the raw color scales. Screens should use the semantic
 * tokens in `colors` rather than referencing the scales directly.
 */
export const palette = {
  white: "#FFFFFF",

  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue500: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",

  teal100: "#CCFBF1",
  teal200: "#99F6E4",
  teal700: "#0F766E",

  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate700: "#334155",
  slate900: "#0F172A",

  red50: "#FEF2F2",
  red600: "#DC2626",
} as const;

export const colors = {
  // Surfaces
  background: palette.slate100,
  surface: palette.white,
  decorationPrimary: palette.blue200,
  decorationAccent: palette.teal200,

  // Text
  textPrimary: palette.slate900,
  textSecondary: palette.slate500,
  textPlaceholder: palette.slate400,
  textOnPrimary: palette.white,
  textOnPrimaryMuted: palette.blue100,

  // Brand
  primary: palette.blue600,
  primaryPressed: palette.blue700,
  primarySoft: palette.blue50,
  onPrimaryOverlay: "rgba(255, 255, 255, 0.18)",
  accent: palette.teal700,
  accentSoft: palette.teal100,

  // Lines
  divider: palette.slate200,

  // Inputs
  inputBackground: palette.slate50,
  inputBackgroundFocused: palette.white,
  inputBorder: palette.slate200,
  inputBorderFocused: palette.blue500,

  // Feedback
  error: palette.red600,
  errorBackground: palette.red50,

  // Shadows
  shadowPrimary: "rgba(37, 99, 235, 0.30)",
  shadowNeutral: "rgba(15, 23, 42, 0.08)",
} as const;
