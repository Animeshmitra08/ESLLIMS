import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";

import { colors } from "@/constants/colors";
import { LABS } from "@/constants/labs";

const GAP = 14;

type Props = {
  /** Labs the user belongs to; these tiles get a "Your lab" tag. */
  userLabs: string[];
};

export default function LabGrid({ userLabs }: Props) {
  const [width, setWidth] = useState(0);
  const columns = width >= 520 ? 3 : 2;
  const tileWidth = width ? (width - GAP * (columns - 1)) / columns : 0;

  const handleLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.grid} onLayout={handleLayout}>
      {tileWidth > 0 &&
        LABS.map((lab) => {
          const isUserLab = userLabs.includes(lab.name);
          return (
            <Pressable
              key={lab.id}
              onPress={() => router.push({ pathname: "/lab/[id]", params: { id: lab.id } })}
              accessibilityRole="button"
              accessibilityLabel={lab.name}
              style={({ pressed }) => [
                styles.tile,
                { width: tileWidth },
                pressed && styles.tilePressed,
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: lab.color.soft }]}>
                <SymbolView name={lab.icon} tintColor={lab.color.tint} size={28} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {lab.name}
              </Text>
              {isUserLab ? (
                <View style={[styles.tag, { backgroundColor: lab.color.soft }]}>
                  <Text style={[styles.tagText, { color: lab.color.tint }]}>Your lab</Text>
                </View>
              ) : (
                <Text style={styles.open}>Open</Text>
              )}
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: "flex-start",
    boxShadow: `0 6px 18px ${colors.shadowNeutral}`,
  },
  tilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  open: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  tag: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
