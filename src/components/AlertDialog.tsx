import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { colors } from "@/constants/colors";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  icon?: SymbolViewProps["name"];
  /** Accent color for the icon and button; defaults to the brand color. */
  tint?: string;
  /** Background of the icon circle; defaults to the soft brand color. */
  soft?: string;
  buttonLabel?: string;
  onClose: () => void;
};

const DEFAULT_ICON: SymbolViewProps["name"] = {
  ios: "exclamationmark.circle.fill",
  android: "error",
  web: "error",
};

/** A centered app-styled alert with a single dismiss button. */
export default function AlertDialog({
  visible,
  title,
  message,
  icon = DEFAULT_ICON,
  tint = colors.primary,
  soft = colors.primarySoft,
  buttonLabel = "OK",
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <View style={[styles.iconCircle, { backgroundColor: soft }]}>
            <SymbolView name={icon} tintColor={tint} size={30} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: tint },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.backdrop,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    boxShadow: `0 12px 32px ${colors.shadowNeutral}`,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    alignSelf: "stretch",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 22,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
