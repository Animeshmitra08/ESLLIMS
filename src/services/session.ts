import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import type { AuthSession, AuthUser } from "@/services/auth";

const USER_KEY = "esllims.session.user";
const TOKEN_KEY = "esllims.session.token";
// Written by earlier versions of the app (user name only, no token).
const LEGACY_KEY = "esllims.session.userName";

type StoredUser = { user: AuthUser; tokenExpiry: string | null };

// expo-secure-store has no web implementation, so on web the session is not
// persisted and lasts only until the page is reloaded.
const isSupported = Platform.OS !== "web";

// The background sample check reads the session, so it must be readable while
// an iPhone is locked (the default, WHEN_UNLOCKED, isn't).
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

// The token is stored on its own because SecureStore may reject values over
// about 2 KB, and tokens can be long.
export async function saveSession({ user, token, tokenExpiry }: AuthSession) {
  if (!isSupported) return;
  const stored: StoredUser = { user, tokenExpiry };
  // Delete first so a session saved by an older version (with the default
  // accessibility) is replaced rather than updated in place.
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
  await SecureStore.setItemAsync(TOKEN_KEY, token, OPTIONS);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(stored), OPTIONS);
}

export async function loadSession(): Promise<AuthSession | null> {
  if (!isSupported) return null;
  const [userJson, token] = await Promise.all([
    SecureStore.getItemAsync(USER_KEY, OPTIONS),
    SecureStore.getItemAsync(TOKEN_KEY, OPTIONS),
  ]);
  if (!userJson || !token) return null;
  try {
    const { user, tokenExpiry } = JSON.parse(userJson) as StoredUser;
    return { user, token, tokenExpiry };
  } catch {
    return null;
  }
}

export async function clearSession() {
  if (!isSupported) return;
  await Promise.all([
    SecureStore.deleteItemAsync(USER_KEY, OPTIONS),
    SecureStore.deleteItemAsync(TOKEN_KEY, OPTIONS),
    SecureStore.deleteItemAsync(LEGACY_KEY),
  ]);
}
