import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";

import { colors } from "@/constants/colors";
import { findLab } from "@/constants/labs";
import { getForms } from "@/services/forms";

export default function LabScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lab = findLab(id);

  if (!lab) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Lab not found" }} />
        <Text style={styles.emptyText}>This lab doesn't exist.</Text>
      </View>
    );
  }

  const forms = getForms();

  return (
    <>
      <Stack.Screen options={{ title: lab.name }} />
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.list}
        data={forms}
        keyExtractor={(form) => form.formId}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: lab.color.soft }]}>
              <SymbolView name={lab.icon} tintColor={lab.color.tint} size={30} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{lab.name}</Text>
              <Text style={styles.subtitle}>
                {forms.length} {forms.length === 1 ? "form" : "forms"}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No forms available.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/form/[formid]",
                params: { formid: item.formId, lab: lab.id },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={item.topic}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.cardIcon, { backgroundColor: lab.color.soft }]}>
              <SymbolView
                name={{ ios: "doc.text.fill", android: "description", web: "description" }}
                tintColor={lab.color.tint}
                size={22}
              />
            </View>
            <Text style={styles.topic} numberOfLines={2}>
              {item.topic}
            </Text>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
              tintColor={colors.textPlaceholder}
              size={18}
            />
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 20,
    gap: 12,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    boxShadow: `0 6px 18px ${colors.shadowNeutral}`,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  topic: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
  },
});
