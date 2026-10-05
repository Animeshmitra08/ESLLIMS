import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from "react-native";
import {
  Drawer,
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "expo-router/drawer";
import { router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, useNotificationSync } from "@/hooks/useNotifications";

type DrawerScreen = {
  /** Route file name in src/app/(drawer), without the extension. */
  name: string;
  title: string;
  icon: SymbolViewProps["name"];
  /** Show the unread notification count next to the label. */
  showUnreadCount?: boolean;
};

/**
 * Screens shown in the drawer — one entry per screen in src/Screens.
 *
 * To add a screen:
 *   1. Create it in src/Screens (e.g. src/Screens/ReportsScreen.tsx).
 *   2. Add a route file src/app/(drawer)/reports.tsx containing
 *      `export { default } from "@/Screens/ReportsScreen";`
 *   3. Add an entry here with name "reports".
 */
const DRAWER_SCREENS: DrawerScreen[] = [
  {
    name: "home",
    title: "Home",
    icon: { ios: "house", android: "home", web: "home" },
  },
  {
    name: "notifications",
    title: "Notifications",
    icon: { ios: "bell", android: "notifications", web: "notifications" },
    showUnreadCount: true,
  },
  {
    name: "send-notification",
    title: "Send Notification",
    icon: { ios: "paperplane", android: "send", web: "send" },
  },
];

export default function DrawerNavigation() {
  // This layout only renders while logged in.
  useNotificationSync();

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerRight: () => <NotificationBell />,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        drawerStyle: { backgroundColor: colors.surface },
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: colors.primarySoft,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: { fontSize: 15, fontWeight: "600" },
        drawerItemStyle: { borderRadius: 12 },
      }}
    >
      {DRAWER_SCREENS.map((screen) => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            drawerLabel: screen.showUnreadCount
              ? ({ color }) => <UnreadLabel title={screen.title} color={color} />
              : screen.title,
            drawerIcon: ({ color, size }) => (
              <SymbolView name={screen.icon} tintColor={color} size={size} />
            ),
            // The bell would just link to the screen you're on.
            ...(screen.name === "notifications" && { headerRight: undefined }),
          }}
        />
      ))}
    </Drawer>
  );
}

const formatCount = (count: number) => (count > 99 ? "99+" : String(count));

function NotificationBell() {
  const { unreadCount } = useNotifications();
  return (
    <Pressable
      onPress={() => router.push("/notifications")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      style={({ pressed }) => [styles.bell, pressed && styles.logoutPressed]}
    >
      <SymbolView
        name={{ ios: "bell", android: "notifications", web: "notifications" }}
        tintColor={colors.textPrimary}
        size={24}
      />
      {unreadCount > 0 && (
        <View style={styles.bellBadge}>
          <Text style={styles.badgeText}>{formatCount(unreadCount)}</Text>
        </View>
      )}
    </Pressable>
  );
}

function UnreadLabel({ title, color }: { title: string; color: ColorValue }) {
  const { unreadCount } = useNotifications();
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.label, { color }]}>{title}</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatCount(unreadCount)}</Text>
        </View>
      )}
    </View>
  );
}

function DrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const confirmLogout = () => {
    const message = "Are you sure you want to logout?";
    // Alert.alert has no web implementation.
    if (Platform.OS === "web") {
      if (window.confirm(message)) signOut();
      return;
    }
    Alert.alert("Logout", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.root}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={styles.profile}>
          <Image
            source={require("@/assets/images/esl_logo.png")}
            style={styles.logo}
            accessibilityLabel="ESL logo"
          />
          <Text style={styles.brand}>ESL LIMS</Text>
          {user && (
            <>
              <Text style={styles.userName} numberOfLines={1}>
                {user.userName}
              </Text>
              <Text style={styles.meta} numberOfLines={2}>
                {user.role}
              </Text>
            </>
          )}
        </View>

        <View style={styles.divider} />

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={confirmLogout}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
        >
          <SymbolView
            name={{
              ios: "rectangle.portrait.and.arrow.right",
              android: "logout",
              web: "logout",
            }}
            tintColor={colors.error}
            size={20}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingHorizontal: 12,
  },
  profile: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 12,
  },
  brand: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.errorBackground,
  },
  logoutPressed: {
    opacity: 0.7,
  },
  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "600",
  },
  bell: {
    marginRight: 16,
    padding: 4,
  },
  bellBadge: {
    position: "absolute",
    top: 0,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
});
