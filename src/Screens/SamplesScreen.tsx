import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import TrnSampleDetailsDialog from "@/components/TrnSampleDetailsDialog";
import { colors } from "@/constants/colors";
import { useHierarchy } from "@/context/HierarchyContext";
import { useLabs } from "@/hooks/useLabs";
import type { TrnSampleTypes } from "@/types/DataTypes";
import { formatDateTime } from "@/utils/date";
import { trnSampleDate, trnSampleStage } from "@/utils/samples";

type SortOrder = "newest" | "oldest";
type LabOption = { id: string; name: string };

const SAMPLE_ICON = { ios: "testtube.2", android: "science", web: "science" } as const;
const DEFAULT_COLOR = { tint: colors.primary, soft: colors.primarySoft };

/**
 * Every registered sample from TrnSampledata (loaded and kept fresh by
 * HierarchyProvider), with search, a lab filter and sorting by registration
 * time.
 *
 * Opened with a `sampleId` param (from a tapped sample notification), it
 * shows that sample's details once the list has it.
 */
export default function SamplesScreen() {
  const { allSamples, samplesLoading, refreshSamples } = useHierarchy();
  const labs = useLabs();
  const { sampleId } = useLocalSearchParams<{ sampleId?: string }>();

  const [query, setQuery] = useState("");
  // null shows every lab.
  const [labId, setLabId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  // A sample picked from the list wins over one from the route.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const openId = selectedId ?? sampleId ?? null;
  const selected = openId ? (allSamples.find((s) => s.Id === openId) ?? null) : null;

  const closeDetails = () => {
    setSelectedId(null);
    // Clear the route's sample so the dialog doesn't reopen, and so tapping
    // the same notification again opens it again.
    if (sampleId) router.setParams({ sampleId: undefined });
  };

  // TrnSampledata only sends the lab's Id; names and colors come from the
  // selected plant's labs. Labs outside that plant show as "Other lab".
  const labFor = (sample: TrnSampleTypes | null) =>
    labs.find((lab) => lab.id === sample?.Dept_Id);
  const labNameFor = (sample: TrnSampleTypes | null) =>
    labFor(sample)?.name ?? (sample?.Dept_Id ? "Other lab" : undefined);

  // Labs that have samples, for the filter chips.
  const labOptions = useMemo(() => {
    const byId = new Map<string, LabOption>();
    for (const sample of allSamples) {
      if (sample.Dept_Id && !byId.has(sample.Dept_Id)) {
        const name = labs.find((lab) => lab.id === sample.Dept_Id)?.name ?? "Other lab";
        byId.set(sample.Dept_Id, { id: sample.Dept_Id, name });
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allSamples, labs]);

  const visibleSamples = useMemo(() => {
    const term = query.trim().toLowerCase();
    const direction = sortOrder === "newest" ? -1 : 1;
    const labName = (id: string) => labs.find((lab) => lab.id === id)?.name ?? "";
    // Fields the search box matches against.
    const searchText = (s: TrnSampleTypes) =>
      [s.SampleCode, labName(s.Dept_Id), s.Shift && `shift ${s.Shift}`, s.F_Year,
        trnSampleStage(s), s.RegisteredBy, s.AnalystBy, s.AssignedTo, s.AssignedTo2]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return allSamples
      .filter((s) => labId === null || s.Dept_Id === labId)
      .filter((s) => !term || searchText(s).includes(term))
      .sort(
        // The dates are ISO-formatted, so text order is time order.
        (a, b) =>
          direction * trnSampleDate(a).localeCompare(trnSampleDate(b)) ||
          a.SampleCode.localeCompare(b.SampleCode)
      );
  }, [allSamples, labs, labId, query, sortOrder]);

  // Lab colors, so each card matches its lab tile on the home screen.
  const tintFor = (sample: TrnSampleTypes | null) => labFor(sample)?.color ?? DEFAULT_COLOR;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSamples();
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = query.trim() !== "" || labId !== null;

  console.log(JSON.stringify(visibleSamples));
  

  return (
    // The drawer header covers the top inset.
    <SafeAreaView style={styles.root} edges={["bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <FlatList
        contentContainerStyle={styles.list}
        data={visibleSamples}
        // Id can be missing (FOR JSON drops NULL columns); fall back so keys stay unique.
        keyExtractor={(item, index) => item.Id || `${item.SampleCode}-${index}`}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.searchBox}>
              <SymbolView
                name={{ ios: "magnifyingglass", android: "search", web: "search" }}
                tintColor={colors.textPlaceholder}
                size={18}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search samples"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {labOptions.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                style={styles.chipScroll}
              >
                {[null, ...labOptions].map((option) => {
                  const active = (option?.id ?? null) === labId;
                  return (
                    <Pressable
                      key={option?.id ?? "all"}
                      onPress={() => setLabId(option?.id ?? null)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {option?.name ?? "All labs"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {!samplesLoading && (
              <View style={styles.summaryRow}>
                <Text style={styles.summary}>
                  {visibleSamples.length} {visibleSamples.length === 1 ? "sample" : "samples"}
                </Text>
                <Pressable
                  onPress={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by date, ${sortOrder} first`}
                  style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
                >
                  <SymbolView
                    name={
                      sortOrder === "newest"
                        ? { ios: "arrow.down", android: "arrow_downward", web: "arrow_downward" }
                        : { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" }
                    }
                    tintColor={colors.primary}
                    size={16}
                  />
                  <Text style={styles.sortText}>
                    {sortOrder === "newest" ? "Newest" : "Oldest"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          samplesLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <EmptyState
              title={filtered ? "No matching samples" : "No samples yet"}
              message={
                filtered
                  ? "Try a different search or lab."
                  : "Samples will appear here as they're received."
              }
              icon={SAMPLE_ICON}
            />
          )
        }
        renderItem={({ item }) => {
          const { tint, soft } = tintFor(item);
          const where = [labNameFor(item), item.Shift && `Shift ${item.Shift}`]
            .filter(Boolean)
            .join(" · ");
          const stage = trnSampleStage(item);
          const date = trnSampleDate(item);
          return (
            <Pressable
              onPress={() => setSelectedId(item.Id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.SampleCode || "Sample"}, ${stage}`}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={[styles.cardIcon, { backgroundColor: soft }]}>
                <SymbolView name={SAMPLE_ICON} tintColor={tint} size={22} />
              </View>
              <View style={styles.cardText}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.SampleCode || "Sample"}
                  </Text>
                  <View style={[styles.stageBadge, { backgroundColor: soft }]}>
                    <Text style={[styles.stageText, { color: tint }]}>{stage}</Text>
                  </View>
                </View>
                {where ? (
                  <Text style={[styles.cardLab, { color: tint }]} numberOfLines={1}>
                    {where}
                  </Text>
                ) : null}
                {date ? <Text style={styles.cardDate}>{formatDateTime(date)}</Text> : null}
              </View>
              <SymbolView
                name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                tintColor={colors.textPlaceholder}
                size={18}
              />
            </Pressable>
          );
        }}
      />
      <TrnSampleDetailsDialog
        sample={selected}
        labName={labNameFor(selected)}
        tint={tintFor(selected).tint}
        onClose={closeDetails}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 20,
    gap: 12,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  headerBlock: {
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
  },
  chipScroll: {
    marginTop: 12,
  },
  chips: {
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  sortText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
  loader: {
    marginTop: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    boxShadow: `0 6px 18px ${colors.shadowNeutral}`,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardText: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  stageBadge: {
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  stageText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardLab: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  cardDate: {
    color: colors.textPlaceholder,
    fontSize: 12,
    marginTop: 4,
  },
});
