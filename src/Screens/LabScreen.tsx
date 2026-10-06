import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AlertDialog from "@/components/AlertDialog";
import EmptyState from "@/components/EmptyState";
import { colors } from "@/constants/colors";
import { useHierarchy } from "@/context/HierarchyContext";
import { useLab } from "@/hooks/useLabs";
import { useNotFoundAlert } from "@/hooks/useNotFoundAlert";
import { fetchLims } from "@/services/ApiServices";
import type { SubSbuTypes } from "@/types/DataTypes";

const LAB_NOT_FOUND = {
  title: "Lab not found",
  message: "This lab doesn't exist or is no longer available.",
  icon: { ios: "flask", android: "science", web: "science" },
} as const;

const EMPTY_ICON = { ios: "tray", android: "inbox", web: "inbox" } as const;

// Opened from a deep link there is nothing to go back to, so go home instead.
const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace("/home");
};

function BackButton() {
  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
    >
      <SymbolView
        name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
        tintColor={colors.textPrimary}
        size={20}
      />
    </Pressable>
  );
}

export default function LabScreen() {
  // `id` is the SBU Id passed from the lab grid.
  const { id } = useLocalSearchParams<{ id: string }>();
  const lab = useLab(id);
  // While the labs are still loading, a missing lab just isn't known yet.
  const { loading: labsLoading } = useHierarchy();
  const insets = useSafeAreaInsets();
  // null while loading.
  const [subSbus, setSubSbus] = useState<SubSbuTypes[] | null>(null);

  const labMissing = !lab && !labsLoading;
  const itemsEmpty = !!lab && subSbus !== null && subSbus.length === 0;
  const alert = useNotFoundAlert(
    labMissing ? `lab:${id}` : itemsEmpty ? `items:${id}` : null
  );

  useEffect(() => {
    if (!id) return;
    // Ignore a late response if the screen closed or the lab changed.
    let active = true;
    fetchLims<unknown>("SubSBUACT", { DeptId: id })
      .then((res) => {
        if (active) setSubSbus(Array.isArray(res) ? res : []);
      })
      .catch((e) => {
        console.warn("SubSBUACT failed", e);
        if (active) setSubSbus([]);
      });
    return () => {
      active = false;
      setSubSbus(null);
    };
  }, [id]);

  // With no navigation header, the screen pads itself clear of the status bar
  // and home indicator.
  const contentInsets = {
    paddingTop: insets.top + 12,
    paddingBottom: insets.bottom + 20,
  };

  if (!lab) {
    return (
      <View style={[styles.root, styles.notFound, contentInsets]}>
        <StatusBar style="dark" />
        <BackButton />
        <View style={styles.center}>
          {labMissing ? (
            <EmptyState
              title={LAB_NOT_FOUND.title}
              message={LAB_NOT_FOUND.message}
              icon={LAB_NOT_FOUND.icon}
              style={styles.notFoundCard}
            />
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
        <AlertDialog
          visible={alert.visible}
          title={LAB_NOT_FOUND.title}
          message={LAB_NOT_FOUND.message}
          icon={LAB_NOT_FOUND.icon}
          onClose={alert.dismiss}
        />
      </View>
    );
  }

  const items = subSbus ?? [];
  const emptyTitle = "No items found";
  const emptyMessage = `There are no items under ${lab.name} yet.`;

  return (
    <>
      <StatusBar style="dark" />
      <FlatList
        style={styles.root}
        contentContainerStyle={[styles.list, contentInsets]}
        data={items}
        keyExtractor={(item) => item.Id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={[styles.header, { backgroundColor: lab.color.soft }]}>
              <BackButton />
              <View style={styles.iconCircle}>
                <SymbolView name={lab.icon} tintColor={lab.color.tint} size={26} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={2}>
                  {lab.name}
                </Text>
                {subSbus && (
                  <Text style={[styles.subtitle, { color: lab.color.tint }]}>
                    {subSbus.length} {subSbus.length === 1 ? "item" : "items"}
                  </Text>
                )}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          subSbus ? (
            <EmptyState
              title={emptyTitle}
              message={emptyMessage}
              icon={EMPTY_ICON}
              tint={lab.color.tint}
              soft={lab.color.soft}
            />
          ) : (
            <ActivityIndicator color={lab.color.tint} />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/form/[formid]",
                params: { formid: item.Id, lab: lab.id, name: item.Name },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={item.Name}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.cardIcon, { backgroundColor: lab.color.soft }]}>
              <SymbolView
                name={{ ios: "doc.text.fill", android: "description", web: "description" }}
                tintColor={lab.color.tint}
                size={22}
              />
            </View>
            <Text style={styles.topic} numberOfLines={2}>
              {item.Name}
            </Text>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              tintColor={colors.textPlaceholder}
              size={18}
            />
          </Pressable>
        )}
      />
      <AlertDialog
        visible={alert.visible}
        title={emptyTitle}
        message={emptyMessage}
        icon={EMPTY_ICON}
        tint={lab.color.tint}
        soft={lab.color.soft}
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
  notFound: {
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundCard: {
    alignSelf: "stretch",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    boxShadow: `0 4px 12px ${colors.shadowNeutral}`,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerBlock: {
    marginBottom: 8,
  },
  // Back button, lab icon and title share one row.
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    padding: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
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
  topic: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
  },
});
