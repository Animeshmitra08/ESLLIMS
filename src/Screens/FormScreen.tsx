import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { colors } from "@/constants/colors";
import { findLab } from "@/constants/labs";
import { findForm } from "@/services/forms";

export default function FormScreen() {
  // `formid` identifies the form; `lab` is the lab it was opened from.
  const { formid, lab: labId } = useLocalSearchParams<{ formid: string; lab?: string }>();
  const form = findForm(formid);
  const lab = findLab(labId);

  if (!form) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Form not found" }} />
        <Text style={styles.emptyText}>No form matches this ID.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Stack.Screen options={{ title: form.topic }} />

      {lab && (
        <View style={[styles.labTag, { backgroundColor: lab.color.soft }]}>
          <Text style={[styles.labTagText, { color: lab.color.tint }]}>{lab.name}</Text>
        </View>
      )}
      <Text style={styles.title}>{form.topic}</Text>
      <Text style={styles.formId} selectable>
        Form ID: {form.formId}
      </Text>

      {/* Placeholder until the form for this formid is built. */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming soon</Text>
        <Text style={styles.cardText}>The fields for this form will appear here.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 20,
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
  },
  labTag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  labTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  formId: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    boxShadow: `0 8px 24px ${colors.shadowNeutral}`,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
});
