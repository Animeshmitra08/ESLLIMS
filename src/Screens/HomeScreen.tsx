import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const { user } = useAuth();

  // The route guard keeps this screen unreachable while logged out.
  if (!user) return null;

  const initials = user.userName.slice(0, 2).toUpperCase();

  return (
    // The drawer header covers the top inset; logout lives in the drawer.
    <SafeAreaView style={styles.root} edges={["bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user.userName}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>User ID</Text>
            <Text style={styles.rowValue}>{user.userName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Role</Text>
            <Text style={styles.rowValue}>{user.role}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.labRow}>
            <Text style={styles.rowLabel}>
              {user.labLocations.length > 1 ? "Lab Locations" : "Lab Location"}
            </Text>
            <View style={styles.chips}>
              {user.labLocations.map((lab) => (
                <View key={lab} style={styles.chip}>
                  <Text style={styles.chipText}>{lab}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    boxShadow: `0 8px 24px ${colors.shadowNeutral}`,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  labRow: {
    paddingVertical: 14,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
});
