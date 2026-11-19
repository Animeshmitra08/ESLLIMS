import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import ParameterCard from "@/components/ParameterCard";
import { colors } from "@/constants/colors";
import type { TrnSampleParam, TrnSampleTypes } from "@/types/DataTypes";
import { formatDateTime } from "@/utils/date";
import { trnSampleStage, visibleParams } from "@/utils/samples";

type Props = {
  /** The sample to show; the dialog is hidden while this is null. */
  sample: TrnSampleTypes | null;
  /** The sample's lab name, if known. */
  labName?: string;
  /** Accent color, normally the lab's tint. */
  tint: string;
  onClose: () => void;
};

/** "ESL ADMIN · 19 Nov 2026, 12:27 PM", leaving out whichever part is missing. */
const byOn = (by: string, on: string) => [by, formatDateTime(on)].filter(Boolean).join(" · ");

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

function ParamSection({ title, params, tint }: { title: string; params: TrnSampleParam[]; tint: string }) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        {title}
        {params.length ? ` (${params.length})` : ""}
      </Text>
      <View style={styles.paramList}>
        {params.map((item, index) => (
          <ParameterCard key={`${item.Seq}-${item.Param}-${index}`} item={item} tint={tint} />
        ))}
      </View>
    </>
  );
}

export default function TrnSampleDetailsDialog({ sample, labName, tint, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const params = sample ? visibleParams(sample.Data) : [];
  const headerParams = sample ? visibleParams(sample.HeaderData) : [];
  const assignedTo = sample
    ? [sample.AssignedTo, sample.AssignedTo2].filter(Boolean).join(", ")
    : "";

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
                <Text style={styles.sheetTitle} selectable>
                  {sample.SampleCode || "Sample"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {[labName, sample.Shift && `Shift ${sample.Shift}`, trnSampleStage(sample)]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
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
                <DetailRow label="Lab" value={labName} />
                <DetailRow label="Shift" value={sample.Shift} />
                <DetailRow label="Financial year" value={sample.F_Year} />
                <DetailRow label="Stage" value={trnSampleStage(sample)} />
                <DetailRow label="Status code" value={sample.Status} />
                <DetailRow label="Document date" value={formatDateTime(sample.Doc_Date)} />
                <DetailRow label="Collected" value={formatDateTime(sample.SampleCollectionDate)} />
                <DetailRow label="Registered" value={byOn(sample.RegisteredBy, sample.RegisteredOn)} />
                <DetailRow label="Received" value={byOn(sample.ReceivedBy, sample.ReceivedOn)} />
                <DetailRow label="Assigned to" value={assignedTo} />
                <DetailRow label="Assigned" value={formatDateTime(sample.AssignedOn)} />
                <DetailRow label="Analysed" value={byOn(sample.AnalystBy, sample.AnalystOn)} />
                <DetailRow label="Published" value={byOn(sample.PublishedBy, sample.PublishedOn)} />
                <DetailRow
                  label="Printed"
                  value={sample.IsPrinted ? `Yes (${sample.PrintCount ?? 1}×)` : "No"}
                />
              </View>

              {headerParams.length > 0 && (
                <ParamSection title="Header" params={headerParams} tint={tint} />
              )}

              {params.length > 0 ? (
                <ParamSection title="Parameters" params={params} tint={tint} />
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Parameters</Text>
                  <EmptyState
                    title="No parameters"
                    message="This sample has no parameter readings."
                    icon={{ ios: "list.bullet.rectangle", android: "list_alt", web: "list_alt" }}
                    tint={tint}
                    soft={colors.background}
                    style={styles.emptyCard}
                  />
                </>
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
    marginBottom: 12,
  },
  // Flat inside the sheet; the sheet already sits above the screen.
  emptyCard: {
    boxShadow: "none",
    paddingVertical: 22,
  },
});
