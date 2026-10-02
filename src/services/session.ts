import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "esllims.session.userName";

// expo-secure-store has no web implementation, so on web the session is not
// persisted and lasts only until the page is reloaded.
const isSupported = Platform.OS !== "web";

export async function saveSessionUserName(userName: string) {
  if (!isSupported) return;
  await SecureStore.setItemAsync(SESSION_KEY, userName);
}

export async function loadSessionUserName() {
  if (!isSupported) return null;
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function clearSession() {
  if (!isSupported) return;
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
