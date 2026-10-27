import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import {
  getFirebaseToken,
  postNotification,
  type FirebaseTokenTypes,
} from "@/services/ApiServices";
import { getForms } from "@/services/forms";
import { NOTIFICATION_CHANNEL_ID } from "@/services/notificationHandlers";

/** Every device registered under one role, shown as a single row. */
type RoleGroup = {
  role: string;
  tokens: string[];
};

type Status = { type: "success" | "error"; message: string } | null;

const TITLE_MAX = 100;
const BODY_MAX = 500;

// Devices registered before roles were saved are grouped under this name.
const NO_ROLE = "No role";

/**
 * `userlog` is a JSON string ({"USER_NAME":"…","ROLE_NAME":"…"}) for devices
 * registered by this app, or a plain user ID (no role) for older registrations.
 */
const parseRole = (userlog: string): string | null => {
  try {
    const parsed = JSON.parse(userlog);
    if (typeof parsed?.ROLE_NAME === "string" && parsed.ROLE_NAME.trim()) {
      return parsed.ROLE_NAME.trim();
    }
  } catch {
    // Not JSON: a plain user ID.
  }
  return null;
};

/**
 * Groups FCM tokens by role, sorted by name with "No role" last. Each token
 * counts once; the backend can hold the same token more than once.
 */
const toRoleGroups = (records: FirebaseTokenTypes[]): RoleGroup[] => {
  const seen = new Set<string>();
  const byRole = new Map<string, string[]>();
  for (const record of records) {
    const token = record.firebaseToken;
    if (!token || seen.has(token)) continue;
    seen.add(token);
    const role = parseRole(record.userlog) ?? NO_ROLE;
    const tokens = byRole.get(role);
    if (tokens) tokens.push(token);
    else byRole.set(role, [token]);
  }
  return [...byRole]
    .map(([role, tokens]) => ({ role, tokens }))
    .sort((a, b) =>
      a.role === NO_ROLE ? 1 : b.role === NO_ROLE ? -1 : a.role.localeCompare(b.role)
    );
};

const recipientCount = (count: number) => `${count} ${count === 1 ? "recipient" : "recipients"}`;

const toMessage = (error: unknown, fallback: string) => {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

export default function SendNotificationScreen() {
  const [groups, setGroups] = useState<RoleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected role names.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formId, setFormId] = useState<string | null>(null);
  const [focused, setFocused] = useState<"title" | "body" | "search" | null>(null);

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const forms = getForms();

  const loadRecipients = useCallback(async () => {
    try {
      const records = await getFirebaseToken();
      const next = toRoleGroups(Array.isArray(records) ? records : []);
      setGroups(next);
      // Keep only selected roles that still have devices.
      setSelected((prev) => new Set(next.filter((g) => prev.has(g.role)).map((g) => g.role)));
      setLoadError(null);
    } catch (error) {
      setLoadError(toMessage(error, "Couldn't load devices. Check your connection and try again."));
    }
  }, []);

  useEffect(() => {
    loadRecipients().finally(() => setLoading(false));
  }, [loadRecipients]);

  const refresh = async () => {
    setRefreshing(true);
    await loadRecipients();
    setRefreshing(false);
  };

  const totalRecipients = groups.reduce((sum, g) => sum + g.tokens.length, 0);

  const selectedTokens = useMemo(
    () => groups.filter((g) => selected.has(g.role)).flatMap((g) => g.tokens),
    [groups, selected]
  );

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((g) => g.role.toLowerCase().includes(query));
  }, [groups, search]);

  const allVisibleSelected =
    visibleGroups.length > 0 && visibleGroups.every((g) => selected.has(g.role));

  const toggleRole = (role: string) => {
    setStatus(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setStatus(null);
    setSelected((prev) => {
      const next = new Set(prev);
      visibleGroups.forEach((g) => (allVisibleSelected ? next.delete(g.role) : next.add(g.role)));
      return next;
    });
  };

  const canSend = !sending && selectedTokens.length > 0 && !!title.trim() && !!body.trim();

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      setStatus({ type: "error", message: "Enter a title and a message." });
      return;
    }
    if (selectedTokens.length === 0) {
      setStatus({ type: "error", message: "Select at least one role." });
      return;
    }

    setSending(true);
    setStatus(null);
    const form = forms.find((f) => f.formId === formId);
    try {
      await postNotification({
        token: selectedTokens,
        title: title.trim(),
        body: body.trim(),
        channelId: NOTIFICATION_CHANNEL_ID,
        // Tapping the notification opens this form (see useNotifications).
        ...(form && { data: { formid: form.formId } }),
      });
      setStatus({
        type: "success",
        message: `Notification sent to ${recipientCount(selectedTokens.length)}.`,
      });
      setTitle("");
      setBody("");
      setFormId(null);
      setSelected(new Set());
    } catch (error) {
      setStatus({ type: "error", message: toMessage(error, "Couldn't send the notification.") });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
        >
          {/* ── Message ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Message</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, focused === "title" && styles.inputFocused]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setStatus(null);
              }}
              placeholder="e.g. Sample ready for analysis"
              placeholderTextColor={colors.textPlaceholder}
              selectionColor={colors.primary}
              maxLength={TITLE_MAX}
              returnKeyType="next"
              onFocus={() => setFocused("title")}
              onBlur={() => setFocused(null)}
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Message</Text>
              <Text style={styles.counter}>
                {body.length}/{BODY_MAX}
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, focused === "body" && styles.inputFocused]}
              value={body}
              onChangeText={(text) => {
                setBody(text);
                setStatus(null);
              }}
              placeholder="Write the notification text"
              placeholderTextColor={colors.textPlaceholder}
              selectionColor={colors.primary}
              maxLength={BODY_MAX}
              multiline
              textAlignVertical="top"
              onFocus={() => setFocused("body")}
              onBlur={() => setFocused(null)}
            />

            <Text style={styles.label}>Open form on tap (optional)</Text>
            <View style={styles.chips}>
              {forms.map((form) => {
                const active = form.formId === formId;
                return (
                  <Pressable
                    key={form.formId}
                    onPress={() => setFormId(active ? null : form.formId)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                      {form.topic}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Recipients ── */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>
                Recipients{totalRecipients ? ` (${selectedTokens.length}/${totalRecipients})` : ""}
              </Text>
              {visibleGroups.length > 0 && (
                <Pressable onPress={toggleAllVisible} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>{allVisibleSelected ? "Deselect all" : "Select all"}</Text>
                </Pressable>
              )}
            </View>

            {groups.length > 0 && (
              <TextInput
                style={[styles.input, styles.search, focused === "search" && styles.inputFocused]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by role"
                placeholderTextColor={colors.textPlaceholder}
                selectionColor={colors.primary}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused("search")}
                onBlur={() => setFocused(null)}
              />
            )}

            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : loadError ? (
              <View style={styles.inlineMessage}>
                <Text style={styles.errorText}>{loadError}</Text>
                <Pressable onPress={refresh} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>Retry</Text>
                </Pressable>
              </View>
            ) : visibleGroups.length === 0 ? (
              <Text style={styles.emptyText}>
                {groups.length ? "No roles match your search." : "No registered devices yet."}
              </Text>
            ) : (
              visibleGroups.map((g, index) => {
                const checked = selected.has(g.role);
                return (
                  <Pressable
                    key={g.role}
                    onPress={() => toggleRole(g.role)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    style={({ pressed }) => [
                      styles.recipient,
                      index > 0 && styles.recipientDivider,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && (
                        <SymbolView
                          name={{ ios: "checkmark", android: "check", web: "check" }}
                          tintColor={colors.textOnPrimary}
                          size={14}
                        />
                      )}
                    </View>
                    <Text style={styles.roleName} numberOfLines={1}>
                      {g.role}
                    </Text>
                    <View style={styles.countTag}>
                      <Text style={styles.countTagText}>{recipientCount(g.tokens.length)}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* ── Send ── */}
        <View style={styles.footer}>
          {status && (
            <View style={[styles.status, status.type === "error" ? styles.statusError : styles.statusSuccess]}>
              <Text style={status.type === "error" ? styles.errorText : styles.successText}>
                {status.message}
              </Text>
            </View>
          )}
          <Pressable
            onPress={send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSend }}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              !canSend && styles.buttonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <>
                <SymbolView
                  name={{ ios: "paperplane.fill", android: "send", web: "send" }}
                  tintColor={colors.textOnPrimary}
                  size={18}
                />
                <Text style={styles.buttonText}>
                  Send{selectedTokens.length ? ` to ${selectedTokens.length}` : ""}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 16,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    boxShadow: `0 6px 18px ${colors.shadowNeutral}`,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  counter: {
    color: colors.textPlaceholder,
    fontSize: 12,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: colors.inputBorderFocused,
    backgroundColor: colors.inputBackgroundFocused,
  },
  textArea: {
    minHeight: 110,
  },
  search: {
    marginBottom: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    maxWidth: "100%",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  loader: {
    paddingVertical: 24,
  },
  inlineMessage: {
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 16,
    textAlign: "center",
  },
  recipient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  recipientDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pressed: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
  },
  countTag: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  countTagText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    padding: 16,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  status: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusError: {
    backgroundColor: colors.errorBackground,
  },
  statusSuccess: {
    backgroundColor: colors.accentSoft,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  successText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    maxWidth: 608,
    alignSelf: "center",
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
