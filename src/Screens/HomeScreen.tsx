import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { SymbolViewProps } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";

import AlertDialog from "@/components/AlertDialog";
import EmptyState from "@/components/EmptyState";
import LabGrid from "@/components/LabGrid";
import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useHierarchy, type HierarchyMissing } from "@/context/HierarchyContext";
import { useNotFoundAlert } from "@/hooks/useNotFoundAlert";
import type { LocationTypes, PlantTypes } from "@/types/DataTypes";

type Fallback = { title: string; message: string; icon: SymbolViewProps["name"] };

// What to tell the user for each level of the hierarchy that came back empty.
const getFallback = (
  missing: HierarchyMissing,
  location: LocationTypes | null,
  plant: PlantTypes | null
): Fallback => {
  switch (missing) {
    case "location":
      return {
        title: "Location not found",
        message: "No location is set up for your company yet. Please contact your administrator.",
        icon: { ios: "mappin.slash", android: "location_off", web: "location_off" },
      };
    case "plant":
      return {
        title: "Plant not found",
        message: `No plants are set up for ${location?.Name || "your location"} yet.`,
        icon: { ios: "building.2", android: "factory", web: "factory" },
      };
    case "lab":
      return {
        title: "Labs not found",
        message: `No labs are set up for ${plant?.Name || "your plant"} yet.`,
        icon: { ios: "flask", android: "science", web: "science" },
      };
  }
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { location, selectedPlant, loading, missing } = useHierarchy();
  const fallback = missing ? getFallback(missing, location, selectedPlant) : null;
  const alert = useNotFoundAlert(missing ? `${missing}:${user?.companyId}` : null);

  // The route guard keeps this screen unreachable while logged out.
  if (!user) return null;

  const initials = user.userName.slice(0, 2).toUpperCase();

  return (
    // The drawer header covers the top inset; logout lives in the drawer.
    <SafeAreaView style={styles.root} edges={["bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* hero card */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user.userName}
            </Text>
            {location?.Name ? (
              <Text style={styles.location} numberOfLines={1}>
                {location.Name}
              </Text>
            ) : null}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Labs</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : fallback ? (
          <EmptyState title={fallback.title} message={fallback.message} icon={fallback.icon} />
        ) : (
          <LabGrid />
        )}
      </ScrollView>

      {fallback && (
        <AlertDialog
          visible={alert.visible}
          title={fallback.title}
          message={fallback.message}
          icon={fallback.icon}
          onClose={alert.dismiss}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 20,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    boxShadow: `0 12px 28px ${colors.shadowPrimary}`,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.onPrimaryOverlay,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  heroText: {
    flex: 1,
  },
  welcome: {
    color: colors.textOnPrimaryMuted,
    fontSize: 14,
  },
  userName: {
    color: colors.textOnPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  location: {
    color: colors.textOnPrimaryMuted,
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.onPrimaryOverlay,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  roleBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 24,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
});
