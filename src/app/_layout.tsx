import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { colors } from "@/constants/colors";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { HierarchyProvider } from "@/context/HierarchyContext";

// Keep the splash screen up until the saved session has been checked, so the
// login screen doesn't flash for users who are already logged in.
SplashScreen.preventAutoHideAsync();

// Header for screens pushed on top of the drawer (lab and form pages).
const detailHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontWeight: "700" as const },
  headerShadowVisible: false,
};

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
        {/* The lab screen draws its own header with a back button. */}
        <Stack.Screen name="lab/[id]" />
        <Stack.Screen
          name="form/[formid]"
          options={{ ...detailHeaderOptions, headerBackTitle: "Back" }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <HierarchyProvider>
        <RootNavigator />
      </HierarchyProvider>
    </AuthProvider>
  );
}
