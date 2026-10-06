import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { colors } from "@/constants/colors";

type Props = {
  title: string;
  message?: string;
  icon?: SymbolViewProps["name"];
  /** Icon color; defaults to the brand color. */
  tint?: string;
  /** Background of the icon circle; defaults to the soft brand color. */
  soft?: string;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_ICON: SymbolViewProps["name"] = {
  ios: "magnifyingglass",
  android: "search_off",
  web: "search_off",
};

/** A card that stands in for a list or section that has no data. */
export default function EmptyState({
  title,
  message,
  icon = DEFAULT_ICON,
  tint = colors.primary,
  soft = colors.primarySoft,
  style,
}: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconCircle, { backgroundColor: soft }]}>
        <SymbolView name={icon} tintColor={tint} size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    boxShadow: `0 6px 18px ${colors.shadowNeutral}`,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },
});
