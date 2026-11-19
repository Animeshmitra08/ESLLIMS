import { Alert, Platform } from "react-native";

import { useAuth } from "@/context/AuthContext";

/** Returns a function that asks for confirmation, then logs out. */
export function useConfirmLogout() {
  const { signOut } = useAuth();

  return () => {
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
}
