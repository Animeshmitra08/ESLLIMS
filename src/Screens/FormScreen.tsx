import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";

import AlertDialog from "@/components/AlertDialog";
import EmptyState from "@/components/EmptyState";
import SampleDetailsDialog from "@/components/SampleDetailsDialog";
import { colors } from "@/constants/colors";
import { useLab } from "@/hooks/useLabs";
import { useNotFoundAlert } from "@/hooks/useNotFoundAlert";
import { fetchLims } from "@/services/ApiServices";
import type { SampleDataTypes } from "@/types/DataTypes";

type SortOrder = "newest" | "oldest";

const SAMPLE_ICON = { ios: "testtube.2", android: "science", web: "science" } as const;

// Numeric-aware, so "2024-25" sorts before "2025-26". F_Year may be missing
// or a number, so compare it as text.
const compareYear = (a: unknown, b: unknown) =>
  String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });

/**
 * SampleAll doesn't always return a list (it can be empty, an object or a JSON
 * string), so anything that isn't a list of samples becomes an empty list.
 */
const toSampleList = (res: unknown): SampleDataTypes[] => {
  let value = res;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      value = null;
    }
  }
  if (!Array.isArray(value)) {
    if (value != null) console.warn("SampleAll returned an unexpected response", res);
    return [];
  }
  return value.filter(
    (item): item is SampleDataTypes => typeof item === "object" && item !== null
  );
};

export default function FormScreen() {
  // `formid` is the sub-SBU Id tapped on the lab screen, `name` its Name, and
  // `lab` the SBU Id it was opened from.
  const {
    formid,
    name,
    lab: labId,
  } = useLocalSearchParams<{ formid: string; name?: string; lab?: string }>();
  const lab = useLab(labId);
  const tint = lab?.color.tint ?? colors.primary;
  const soft = lab?.color.soft ?? colors.primarySoft;

  // null while loading.
  const [samples, setSamples] = useState<SampleDataTypes[] | null>(null);
  // null shows every year.
  const [year, setYear] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selected, setSelected] = useState<SampleDataTypes | null>(null);

  useEffect(() => {
    if (!formid) return;
    // Ignore a late response if the screen closed or the sub-SBU changed.
    let active = true;
    fetchLims<unknown>("SampleAll", { Id: formid })
      .then((res) => {
        if (active) setSamples(toSampleList(res));
      })
      .catch((e) => {
        console.warn("SampleAll failed", e);
        if (active) setSamples([]);
      });
    return () => {
      active = false;
      setSamples(null);
    };
  }, [formid]);

  // Every F_Year in the response, newest first, for the filter chips.
  const years = useMemo(() => {
    const unique = new Set((samples ?? []).map((s) => s.F_Year).filter(Boolean));
    return [...unique].sort((a, b) => compareYear(b, a));
  }, [samples]);

  const visibleSamples = useMemo(() => {
    const direction = sortOrder === "newest" ? -1 : 1;
    return (samples ?? [])
      .filter((s) => year === null || s.F_Year === year)
      .sort(
        (a, b) =>
          direction * compareYear(a.F_Year, b.F_Year) ||
          (a.Name ?? "").localeCompare(b.Name ?? "")
      );
  }, [samples, year, sortOrder]);

  const title = name ?? "Samples";
  const emptyTitle = "Sample not found";
  const emptyMessage = `No samples are available for ${title} yet.`;
  const alert = useNotFoundAlert(samples?.length === 0 ? `samples:${formid}` : null);

  return (
    <>
      <Stack.Screen options={{ title }} />
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.list}
        data={visibleSamples}
        keyExtractor={(item) => item.Id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {lab && (
              <View style={[styles.labTag, { backgroundColor: soft }]}>
                <Text style={[styles.labTagText, { color: tint }]}>{lab.name}</Text>
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            {samples && (
              <Text style={styles.subtitle}>
                {visibleSamples.length} {visibleSamples.length === 1 ? "sample" : "samples"}
              </Text>
            )}

            {years.length > 0 && (
              <View style={styles.toolbar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                  style={styles.chipScroll}
                >
                  {[null, ...years].map((option) => {
                    const active = option === year;
                    return (
                      <Pressable
                        key={option ?? "all"}
                        onPress={() => setYear(option)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={[styles.chip, active && { backgroundColor: tint, borderColor: tint }]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {option ?? "All years"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable
                  onPress={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by year, ${sortOrder} first`}
                  style={({ pressed }) => [styles.sortButton, pressed && styles.cardPressed]}
                >
                  <SymbolView
                    name={
                      sortOrder === "newest"
                        ? { ios: "arrow.down", android: "arrow_downward", web: "arrow_downward" }
                        : { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" }
                    }
                    tintColor={tint}
                    size={16}
                  />
                  <Text style={[styles.sortText, { color: tint }]}>
                    {sortOrder === "newest" ? "Newest" : "Oldest"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          samples ? (
            <EmptyState
              title={emptyTitle}
              message={emptyMessage}
              icon={SAMPLE_ICON}
              tint={tint}
              soft={soft}
            />
          ) : (
            <ActivityIndicator color={tint} />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item)}
            accessibilityRole="button"
            accessibilityLabel={item.Name}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.cardIcon, { backgroundColor: soft }]}>
              <SymbolView
                name={SAMPLE_ICON}
                tintColor={tint}
                size={22}
              />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.Name}
              </Text>
              {item.Description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.Description}
                </Text>
              ) : null}
              {item.F_Year ? <Text style={[styles.cardYear, { color: tint }]}>{item.F_Year}</Text> : null}
            </View>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              tintColor={colors.textPlaceholder}
              size={18}
            />
          </Pressable>
        )}
      />
      <SampleDetailsDialog sample={selected} tint={tint} onClose={() => setSelected(null)} />
      <AlertDialog
        visible={alert.visible}
        title={emptyTitle}
        message={emptyMessage}
        icon={SAMPLE_ICON}
        tint={tint}
        soft={soft}
        onClose={alert.dismiss}
      />
    </>
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
  labTag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  labTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  chipScroll: {
    flex: 1,
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
  chipText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.textOnPrimary,
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
    fontSize: 13,
    fontWeight: "700",
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
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  cardYear: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
});
