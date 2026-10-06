import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import { colors } from "@/constants/colors";
import type { SampleDataTypes, SampleHeaderData } from "@/types/DataTypes";
import { formatDateTime } from "@/utils/date";

type Props = {
  /** The sample to show; the dialog is hidden while this is null. */
  sample: SampleDataTypes | null;
  /** Accent color, normally the lab's tint. */
  tint: string;
  onClose: () => void;
};

const yesNo = (value: boolean) => (value ? "Yes" : "No");

/** "Min – Max" when either bound is set, otherwise null. */
const formatRange = ({ Min, Max }: SampleHeaderData) => {
  if (Min == null && Max == null) return null;
  return `${Min ?? "–"} – ${Max ?? "–"}`;
};

// Seq may be missing or a number, so compare it as text.
const bySeq = (a: SampleHeaderData, b: SampleHeaderData) =>
  String(a.Seq ?? "").localeCompare(String(b.Seq ?? ""), undefined, { numeric: true });

/**
 * HeaderData can arrive as an array or as a JSON string of one, depending on
 * the API, so accept both and drop anything that isn't a parameter object.
 */
const parseHeaderData = (raw: unknown): SampleHeaderData[] => {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      console.warn("HeaderData is not valid JSON", raw);
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SampleHeaderData => typeof item === "object" && item !== null
  );
};

// The API sends "--" when a parameter has no unit.
const hasUnit = (uom: string | null | undefined) => !!uom && uom.trim() !== "--";

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} selectable>
        {value}
      </Text>
    </View>
  );
}

function HeaderDataCard({ item, tint }: { item: SampleHeaderData; tint: string }) {
  const range = formatRange(item);
  const value = [item.Value, hasUnit(item.Uom) ? item.Uom : null].filter(Boolean).join(" ");
  // The tag usually repeats the parameter name, so only show it when it differs.
  const tag = item.Tag && item.Tag !== item.Param ? item.Tag : null;
  return (
    <View style={styles.paramCard}>
      <View style={styles.paramTop}>
        <Text style={styles.paramName} numberOfLines={2}>
          {item.Param}
        </Text>
        <Text style={[styles.paramValue, { color: value ? tint : colors.textPlaceholder }]} selectable>
          {value || "—"}
        </Text>
      </View>
      {(tag || range) && (
        <View style={styles.paramMeta}>
          {tag ? <Text style={styles.paramMetaText}>Tag: {tag}</Text> : null}
          {range ? <Text style={styles.paramMetaText}>Range: {range}</Text> : null}
        </View>
      )}
    </View>
  );
}

export default function SampleDetailsDialog({ sample, tint, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const headerData = sample ? parseHeaderData(sample.HeaderData).sort(bySeq) : [];

  return (
    <Modal
      visible={sample !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Tapping outside the sheet closes it. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {sample && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleBlock}>
                <Text style={styles.sheetTitle}>{sample.Name}</Text>
                {sample.Description ? (
                  <Text style={styles.sheetSubtitle}>{sample.Description}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <SymbolView
                  name={{ ios: "xmark", android: "close", web: "close" }}
                  tintColor={colors.textPrimary}
                  size={18}
                />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailCard}>
                {/* <DetailRow label="Sample ID" value={sample.SampleId} /> */}
                <DetailRow label="Financial year" value={sample.F_Year} />
                <DetailRow label="Sample type" value={sample.SampleType} />
                <DetailRow label="Sample format" value={sample.SampleFormat} />
                <DetailRow label="Frequency" value={sample.SampleFrequency} />
                <DetailRow label="Material category" value={sample.MaterialCategory} />
                <DetailRow label="Analysis code" value={sample.AnalysisCode} />
                <DetailRow
                  label="Plant"
                  value={[sample.PlantName, sample.PlantCode && `(${sample.PlantCode})`]
                    .filter(Boolean)
                    .join(" ")}
                />
                <DetailRow label="Unit" value={sample.UnitName} />
                <DetailRow label="Sub unit" value={sample.SubUnitName} />
                <DetailRow label="Retention period" value={sample.RetentionPeriod} />
                <DetailRow label="Reporting time" value={sample.ReportingTime} />
                {/* <DetailRow label="Auto receive" value={yesNo(sample.IsAutoReceive)} />
                <DetailRow label="Auto handover" value={yesNo(sample.AutoHandover)} />
                <DetailRow label="Weighable on handover" value={yesNo(sample.WeighableOnHandover)} />
                <DetailRow label="Biometric on handover" value={yesNo(sample.IsBionetricOnHandover)} />
                <DetailRow label="Auto dispose" value={yesNo(sample.IsAutoDispose)} /> */}
                <DetailRow label="Created by" value={sample.CreatedBy} />
                <DetailRow label="Created on" value={formatDateTime(sample.CreatedOn)} />
              </View>

              <Text style={styles.sectionTitle}>
                Parameters{headerData.length ? ` (${headerData.length})` : ""}
              </Text>
              {headerData.length ? (
                <View style={styles.paramList}>
                  {headerData.map((item, index) => (
                    <HeaderDataCard key={`${item.Seq}-${item.Param}-${index}`} item={item} tint={tint} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="Parameters not found"
                  message="This sample has no header parameters."
                  icon={{ ios: "list.bullet.rectangle", android: "list_alt", web: "list_alt" }}
                  tint={tint}
                  soft={colors.background}
                  style={styles.emptyCard}
                />
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.backdrop,
  },
  sheet: {
    maxHeight: "88%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitleBlock: {
    flex: 1,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  paramList: {
    gap: 10,
  },
  paramCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
  },
  paramTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  paramName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  paramValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  paramMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 4,
    marginTop: 6,
  },
  paramMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  // Flat inside the sheet; the sheet already sits above the screen.
  emptyCard: {
    boxShadow: "none",
    paddingVertical: 22,
  },
});
