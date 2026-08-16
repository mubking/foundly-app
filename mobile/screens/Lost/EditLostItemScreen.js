import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useEditLostForm } from "../../hooks/useEditLostForm";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import LostDetailsStep from "../../components/common/LostDetailsStep";
import LostLocationStep from "../../components/common/LostLocationStep";
import LostReviewStep from "../../components/common/LostReviewStep";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import Button from "../../components/Button/Button";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

export default function EditLostItemScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute();
  const form = useEditLostForm(route.params?.id);

  if (form.loading || form.loadError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Edit Lost Item" onBack={form.handleBack} />
        <StatusState
          loading={form.loading}
          message={form.loadError}
          actionLabel={form.loadError ? "Go Back" : undefined}
          onAction={form.handleBack}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Edit Lost Item" onBack={form.handleBack} />

      <KeyboardAvoidingScreen>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LostDetailsStep form={form} />
          <LostLocationStep form={form} />
          <LostReviewStep form={form} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            fullWidth
            disabled={form.submitting}
            onPress={form.handleSubmit}
            icon={<CheckCircleIcon size={18} color="#fff" />}
          >
            {form.submitting
              ? form.uploadProgress > 0
                ? `Saving… ${form.uploadProgress}%`
                : "Saving…"
              : "Save Changes"}
          </Button>
        </View>
      </KeyboardAvoidingScreen>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
