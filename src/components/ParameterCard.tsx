import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";

/** The fields shared by SampleAll's HeaderData and TrnSampledata's Data. */
export type ParameterLike = {
  Param?: string | null;
  Tag?: string | null;
  Value?: number | string | null;
  Uom?: string | null;
  Min?: number | null;
  Max?: number | null;
  Source?: string;
};

// The API sends "--" when a parameter has no unit.
const hasUnit = (uom: string | null | undefined) => !!uom && uom.trim() !== "--";

/**
 * "Min – Max" when a range is set, otherwise null. 0 – 0 is how the API
 * sends "no range", so it's hidden too.
 */
const formatRange = ({ Min, Max }: ParameterLike) => {
  if (Min == null && Max == null) return null;
  if (Min === 0 && Max === 0) return null;
  return `${Min ?? "–"} – ${Max ?? "–"}`;
};

/** One parameter: name, value with unit, and tag/range/source underneath. */
export default function ParameterCard({ item, tint }: { item: ParameterLike; tint: string }) {
  const range = formatRange(item);
  // 0 is a real reading, so only null/undefined/"" count as no value.
  const hasValue = item.Value !== null && item.Value !== undefined && item.Value !== "";
  const value = hasValue
    ? [String(item.Value), hasUnit(item.Uom) ? item.Uom : null].filter(Boolean).join(" ")
    : "";
  // The tag usually repeats the parameter name, so only show it when it differs.
  const tag = item.Tag && item.Tag !== item.Param ? item.Tag : null;
  const source = item.Source === "Calculated" ? "Calculated" : null;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={2}>
          {item.Param || item.Tag || "Unnamed parameter"}
        </Text>
        <Text style={[styles.value, { color: value ? tint : colors.textPlaceholder }]} selectable>
          {value || "—"}
        </Text>
      </View>
      {(tag || range || source) && (
        <View style={styles.meta}>
          {tag ? <Text style={styles.metaText}>Tag: {tag}</Text> : null}
          {range ? <Text style={styles.metaText}>Range: {range}</Text> : null}
          {source ? <Text style={styles.metaText}>{source}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  value: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 4,
    marginTop: 6,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
