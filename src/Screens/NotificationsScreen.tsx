import { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { getNotificationFormId, useNotifications } from "@/hooks/useNotifications";
import {
  clearNotifications,
  deleteNotification,
  loadNotifications,
  markAllNotificationsRead,
  setNotificationRead,
  type AppNotification,
} from "@/services/notificationStore";

type Filter = "all" | "unread";

const formatTime = (timestamp: number) => {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const confirm = (title: string, message: string, action: string, onConfirm: () => void) => {
  // Alert.alert has no web implementation.
  if (Platform.OS === "web") {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: action, style: "destructive", onPress: onConfirm },
  ]);
};

const logError = (e: unknown) => console.warn("Notification update failed", e);

export default function NotificationsScreen() {
  const { notifications, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const refresh = async () => {
    setRefreshing(true);
    await loadNotifications().catch(logError);
    setRefreshing(false);
  };

  const open = (item: AppNotification) => {
    setNotificationRead(item.id, true).catch(logError);
    const formid = getNotificationFormId(item.data);
    if (formid) {
      router.push({
        pathname: "/form/[formid]",
        params: item.data.lab ? { formid, lab: item.data.lab } : { formid },
      });
    }
  };

  const showItemMenu = (item: AppNotification) => {
    confirm("Delete notification", `Delete "${item.title}"?`, "Delete", () =>
      deleteNotification(item.id).catch(logError)
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["bottom", "left", "right"]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.toolbar}>
            <View style={styles.filters}>
              {(["all", "unread"] as const).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setFilter(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === value }}
                  style={[styles.filter, filter === value && styles.filterActive]}
                >
                  <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                    {value === "all" ? "All" : `Unread${unreadCount ? ` (${unreadCount})` : ""}`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actions}>
              {unreadCount > 0 && (
                <Pressable
                  onPress={() => markAllNotificationsRead().catch(logError)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionText}>Mark all read</Text>
                </Pressable>
              )}
              {notifications.length > 0 && (
                <Pressable
                  onPress={() =>
                    confirm("Clear all", "Delete all notifications?", "Clear all", () =>
                      clearNotifications().catch(logError)
                    )
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionText, styles.actionDanger]}>Clear all</Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <SymbolView
                name={{ ios: "bell.slash", android: "notifications_off", web: "notifications_off" }}
                tintColor={colors.textPlaceholder}
                size={32}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </Text>
            <Text style={styles.emptyText}>New notifications will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            onLongPress={() => showItemMenu(item)}
            accessibilityRole="button"
            accessibilityHint="Long press to delete"
            style={({ pressed }) => [
              styles.card,
              !item.read && styles.cardUnread,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.dotColumn}>{!item.read && <View style={styles.dot} />}</View>

            <View style={styles.content}>
              <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={2}>
                {item.title}
              </Text>
              {!!item.body && (
                <Text style={styles.body} numberOfLines={3}>
                  {item.body}
                </Text>
              )}
              <Text style={styles.time}>{formatTime(item.receivedAt)}</Text>
            </View>

            <Pressable
              onPress={() => setNotificationRead(item.id, !item.read).catch(logError)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={item.read ? "Mark as unread" : "Mark as read"}
              style={({ pressed }) => [styles.toggle, pressed && styles.cardPressed]}
            >
              <SymbolView
                name={
                  item.read
                    ? { ios: "envelope.badge", android: "mark_email_unread", web: "mark_email_unread" }
                    : { ios: "envelope.open", android: "mark_email_read", web: "mark_email_read" }
                }
                tintColor={item.read ? colors.textSecondary : colors.primary}
                size={20}
              />
            </Pressable>
          </Pressable>
        )}
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
    padding: 16,
    gap: 10,
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  filters: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
  },
  filter: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
  actionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  actionDanger: {
    color: colors.error,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingRight: 12,
    boxShadow: `0 4px 14px ${colors.shadowNeutral}`,
  },
  cardUnread: {
    backgroundColor: colors.primarySoft,
  },
  cardPressed: {
    opacity: 0.7,
  },
  dotColumn: {
    width: 24,
    alignItems: "center",
    paddingTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  titleUnread: {
    fontWeight: "700",
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 19,
  },
  time: {
    color: colors.textPlaceholder,
    fontSize: 12,
    marginTop: 8,
  },
  toggle: {
    padding: 4,
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
