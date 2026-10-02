import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider, useAuth } from "@/context/AuthContext";

// Keep the splash screen up until the saved session has been checked, so the
// login screen doesn't flash for users who are already logged in.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, isRestoring } = useAuth();
  const isLoggedIn = user !== null;

  useEffect(() => {
    if (!isRestoring) SplashScreen.hide();
  }, [isRestoring]);

  if (isRestoring) return null;

  // Changing a guard redirects automatically: logging in leaves the login
  // screen for the drawer, and logging out returns to login.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(drawer)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
