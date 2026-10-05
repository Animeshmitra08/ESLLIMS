import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import LabGrid from "@/components/LabGrid";
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

        <Text style={styles.sectionTitle}>Labs</Text>
        <LabGrid />
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
});
