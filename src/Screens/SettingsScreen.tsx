import type { ReactNode } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { StatusBar } from "expo-status-bar";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useConfirmLogout } from "@/hooks/useConfirmLogout";
import { useSettings } from "@/hooks/useSettings";
import { updateSettings, type AppSettings } from "@/services/settingsStore";

// iOS doesn't let apps turn vibration on or off; it follows the system settings.
const canControlVibration = Platform.OS === "android";

const save = (changes: Partial<AppSettings>) =>
  updateSettings(changes).catch((e) => console.warn("Failed to save settings", e));

/**
 * Turning notifications on needs the OS permission. If the user denied it
 * earlier, the app can't ask again, so offer to open the system settings.
 */
const enableNotifications = async () => {
  if (Platform.OS !== "web") {
    const { authorizationStatus } = await notifee.requestPermission();
    if (authorizationStatus === AuthorizationStatus.DENIED) {
      Alert.alert(
        "Notifications are blocked",
        "Allow notifications for ESL LIMS in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
  }
  await save({ notifications: true });
};

export default function SettingsScreen() {
  const { user } = useAuth();
  const settings = useSettings();
  const confirmLogout = useConfirmLogout();

  const onToggleNotifications = (value: boolean) => {
    if (value) {
      enableNotifications().catch((e) => console.warn("Failed to enable notifications", e));
    } else {
      save({ notifications: false });
    }
  };

  return (
    // The drawer header covers the top inset.
    <SafeAreaView style={styles.root} edges={["bottom", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <SettingRow
            icon={{ ios: "bell", android: "notifications", web: "notifications" }}
            title="Notifications"
            description="Show alerts for new samples and messages. When off, they're still listed under Notifications."
          >
            <SettingSwitch value={settings.notifications} onValueChange={onToggleNotifications} />
          </SettingRow>

          <View style={styles.divider} />

          <SettingRow
            icon={{ ios: "speaker.wave.2", android: "volume_up", web: "volume_up" }}
            title="Sound"
            description="Play a sound when a notification arrives."
            disabled={!settings.notifications}
          >
            <SettingSwitch
              value={settings.sound}
              onValueChange={(sound) => save({ sound })}
              disabled={!settings.notifications}
            />
          </SettingRow>

          <View style={styles.divider} />

          <SettingRow
            icon={{ ios: "iphone.radiowaves.left.and.right", android: "vibration", web: "vibration" }}
            title="Vibrate"
            description={
              canControlVibration
                ? "Vibrate when a notification arrives."
                : "On iPhone, vibration follows Settings › Sounds & Haptics."
            }
            disabled={!settings.notifications || !canControlVibration}
          >
            <SettingSwitch
              value={canControlVibration ? settings.vibrate : true}
              onValueChange={(vibrate) => save({ vibrate })}
              disabled={!settings.notifications || !canControlVibration}
            />
          </SettingRow>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {user && (
            <>
              <SettingRow
                icon={{ ios: "person.crop.circle", android: "account_circle", web: "account_circle" }}
                title={user.userName}
                description={user.role}
              />
              <View style={styles.divider} />
            </>
          )}
          <Pressable
            onPress={confirmLogout}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <SettingRow
              icon={{
                ios: "rectangle.portrait.and.arrow.right",
                android: "logout",
                web: "logout",
              }}
              title="Log out"
              destructive
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingSwitch(props: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      {...props}
      trackColor={{ false: colors.divider, true: colors.primary }}
      thumbColor={Platform.OS === "android" ? colors.surface : undefined}
      ios_backgroundColor={colors.divider}
    />
  );
}

function SettingRow({
  icon,
  title,
  description,
  disabled,
  destructive,
  children,
}: {
  icon: SymbolViewProps["name"];
  title: string;
  description?: string;
  disabled?: boolean;
  destructive?: boolean;
  children?: ReactNode;
}) {
  const tint = destructive ? colors.error : colors.primary;
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: destructive ? colors.errorBackground : colors.primarySoft },
        ]}
      >
        <SymbolView name={icon} tintColor={tint} size={20} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, destructive && { color: colors.error }]}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {children}
    </View>
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
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    boxShadow: `0 4px 12px ${colors.shadowNeutral}`,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  rowDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 64,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
