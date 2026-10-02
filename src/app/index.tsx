import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

// Space kept between the bottom of the card and the top of the keyboard.
const CARD_KEYBOARD_GAP = 16;

// esl_logo.png is 180×180 px with its own light background and padding around
// the mark, so it's shown as a rounded tile. 112 pt keeps the mark prominent
// without upscaling the image much on high-density screens.
const LOGO_SIZE = 112;
const LOGO_RADIUS = 28;

export default function LoginScreen() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"userId" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const viewportHeight = useRef(0);
  const cardBottom = useRef(0);
  const { signIn } = useAuth();

  // While the keyboard is open, scroll only as far as needed for the bottom of
  // the card (the Login button) to sit just above the keyboard. Called from
  // the keyboard event and from layout changes, because the
  // KeyboardAvoidingView shrinks the ScrollView after the keyboard event fires.
  const scrollCardIntoView = () => {
    if (!Keyboard.isVisible()) return;
    const offset = cardBottom.current + CARD_KEYBOARD_GAP - viewportHeight.current;
    if (offset > 0) scrollRef.current?.scrollTo({ y: offset, animated: true });
  };

  const handleViewportLayout = (e: LayoutChangeEvent) => {
    viewportHeight.current = e.nativeEvent.layout.height;
    scrollCardIntoView();
  };

  const handleCardLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    cardBottom.current = y + height;
    scrollCardIntoView();
  };

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", scrollCardIntoView);
    return () => sub.remove();
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    if (!userId.trim() || !password) {
      setError("Please enter your User ID and Password.");
      return;
    }
    setError(null);
    setLoading(true);
    // On success the route guard in _layout.tsx switches to the home screen.
    if (!(await signIn(userId, password))) {
      setError("Invalid User ID or Password.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <SafeAreaView style={styles.flex}>
        {/* "padding" on both platforms: the app is edge-to-edge on Android, so
            the window doesn't resize for the keyboard by itself. */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            ref={scrollRef}
            onLayout={handleViewportLayout}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.header}>
              <View style={styles.logo}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.logoImage}
                  resizeMode="cover"
                  accessibilityLabel="ESL logo"
                />
              </View>
              <Text style={styles.title}>ESL LIMS</Text>
              <Text style={styles.subtitle}>
                Laboratory Information Management System
              </Text>
            </View>

            <View style={styles.card} onLayout={handleCardLayout}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>Sign in to continue</Text>

              <Text style={styles.label}>User ID</Text>
              <TextInput
                style={[styles.input, focused === "userId" && styles.inputFocused]}
                value={userId}
                onChangeText={setUserId}
                placeholder="Enter your user ID"
                placeholderTextColor={colors.textPlaceholder}
                selectionColor={colors.primary}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onFocus={() => setFocused("userId")}
                onBlur={() => setFocused(null)}
                onSubmitEditing={() => passwordRef.current?.focus()}
                submitBehavior="submit"
              />

              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.input,
                  styles.passwordRow,
                  focused === "password" && styles.inputFocused,
                ]}
              >
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textPlaceholder}
                  selectionColor={colors.primary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Text style={styles.toggle}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.footer}>© {new Date().getFullYear()} ESL LIMS</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  flex: {
    flex: 1,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.6,
  },
  blobTop: {
    width: 320,
    height: 320,
    top: -120,
    right: -100,
    backgroundColor: colors.decorationPrimary,
  },
  blobBottom: {
    width: 280,
    height: 280,
    bottom: -110,
    left: -90,
    backgroundColor: colors.decorationAccent,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  // The shadow sits on the wrapper and the corner rounding on the image, so
  // the shadow isn't clipped.
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_RADIUS,
    marginBottom: 20,
    boxShadow: `0 10px 28px ${colors.shadowNeutral}`,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_RADIUS,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    boxShadow: `0 12px 32px ${colors.shadowNeutral}`,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 18,
  },
  inputFocused: {
    borderColor: colors.inputBorderFocused,
    backgroundColor: colors.inputBackgroundFocused,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: colors.textPrimary,
  },
  toggle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  errorBox: {
    backgroundColor: colors.errorBackground,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: -4,
    marginBottom: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    boxShadow: `0 10px 20px ${colors.shadowPrimary}`,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 28,
  },
});
