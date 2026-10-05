import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  /** The FCM message's data payload (e.g. formid). */
  data: Record<string, string>;
  receivedAt: number;
  read: boolean;
};

/**
 * Received notifications, persisted in SecureStore.
 *
 * SecureStore may reject values over about 2 KB, so each notification is
 * stored under its own key, plus one small index key listing the IDs (newest
 * first). The list is capped at MAX_NOTIFICATIONS; the oldest are dropped.
 *
 * Both the app and the background message handler write here, so every
 * storage operation runs through one queue to keep the index consistent.
 */

const INDEX_KEY = "esllims.notifications.index";
const ITEM_PREFIX = "esllims.notifications.item.";
const MAX_NOTIFICATIONS = 100;
const MAX_BODY_LENGTH = 1000;

// The default (WHEN_UNLOCKED) would block saving notifications that arrive in
// the background while an iPhone is locked.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

// SecureStore has no web implementation; on web the list lives in memory only.
const isSupported = Platform.OS !== "web";

let items: AppNotification[] = [];
const listeners = new Set<() => void>();

let queue: Promise<unknown> = Promise.resolve();
const serialize = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
};

const setItems = (next: AppNotification[]) => {
  items = next;
  listeners.forEach((listener) => listener());
};

export const subscribeNotifications = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getNotificationsSnapshot = () => items;

// ─── Storage helpers ──────────────────────────────────────────────────────────

const itemKey = (id: string) => ITEM_PREFIX + id;

const readIndex = async (): Promise<string[]> => {
  if (!isSupported) return items.map((n) => n.id);
  const json = await SecureStore.getItemAsync(INDEX_KEY, OPTIONS);
  try {
    const ids = json ? JSON.parse(json) : [];
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const writeIndex = async (ids: string[]) => {
  if (isSupported) await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(ids), OPTIONS);
};

const readItem = async (id: string): Promise<AppNotification | null> => {
  if (!isSupported) return items.find((n) => n.id === id) ?? null;
  const json = await SecureStore.getItemAsync(itemKey(id), OPTIONS);
  try {
    return json ? (JSON.parse(json) as AppNotification) : null;
  } catch {
    return null;
  }
};

const writeItem = async (item: AppNotification) => {
  if (isSupported) await SecureStore.setItemAsync(itemKey(item.id), JSON.stringify(item), OPTIONS);
};

const deleteItems = async (ids: string[]) => {
  if (isSupported) await Promise.all(ids.map((id) => SecureStore.deleteItemAsync(itemKey(id), OPTIONS)));
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Reload the list from storage. Picks up notifications the background handler
 * saved while the app was closed.
 */
export const loadNotifications = () =>
  serialize(async () => {
    if (!isSupported) return;
    const ids = await readIndex();
    const loaded = (await Promise.all(ids.map(readItem))).filter(
      (n): n is AppNotification => n !== null
    );
    setItems(loaded.sort((a, b) => b.receivedAt - a.receivedAt));
  });

/** Save a notification. Returns false if one with the same ID is already saved. */
export const addNotification = (notification: AppNotification) =>
  serialize(async () => {
    const ids = await readIndex();
    if (ids.includes(notification.id)) return false;

    const item = { ...notification, body: notification.body.slice(0, MAX_BODY_LENGTH) };
    await writeItem(item);
    const nextIds = [item.id, ...ids];
    const dropped = nextIds.splice(MAX_NOTIFICATIONS);
    await writeIndex(nextIds);
    await deleteItems(dropped);

    setItems([item, ...items.filter((n) => n.id !== item.id && !dropped.includes(n.id))]);
    return true;
  });

export const setNotificationRead = (id: string, read: boolean) =>
  serialize(async () => {
    const item = items.find((n) => n.id === id) ?? (await readItem(id));
    if (!item || item.read === read) return;
    const updated = { ...item, read };
    await writeItem(updated);
    setItems(items.map((n) => (n.id === id ? updated : n)));
  });

export const markAllNotificationsRead = () =>
  serialize(async () => {
    const unread = items.filter((n) => !n.read);
    if (!unread.length) return;
    await Promise.all(unread.map((n) => writeItem({ ...n, read: true })));
    setItems(items.map((n) => (n.read ? n : { ...n, read: true })));
  });

export const deleteNotification = (id: string) =>
  serialize(async () => {
    const ids = await readIndex();
    await writeIndex(ids.filter((existing) => existing !== id));
    await deleteItems([id]);
    setItems(items.filter((n) => n.id !== id));
  });

/** Remove every saved notification (also used on logout). */
export const clearNotifications = () =>
  serialize(async () => {
    const ids = await readIndex();
    await deleteItems(ids);
    if (isSupported) await SecureStore.deleteItemAsync(INDEX_KEY, OPTIONS);
    setItems([]);
  });
