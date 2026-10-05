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

// The token is stored on its own because SecureStore may reject values over
// about 2 KB, and tokens can be long.
export async function saveSession({ user, token, tokenExpiry }: AuthSession) {
  if (!isSupported) return;
  const stored: StoredUser = { user, tokenExpiry };
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(stored));
}

export async function loadSession(): Promise<AuthSession | null> {
  if (!isSupported) return null;
  const [userJson, token] = await Promise.all([
    SecureStore.getItemAsync(USER_KEY),
    SecureStore.getItemAsync(TOKEN_KEY),
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
    SecureStore.deleteItemAsync(USER_KEY),
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(LEGACY_KEY),
  ]);
}
