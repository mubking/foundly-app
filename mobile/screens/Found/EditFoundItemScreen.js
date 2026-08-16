import React, { useMemo } from "react";
import { Text, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useEditFoundForm } from "../../hooks/useEditFoundForm";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import FoundItemFields from "../../components/common/FoundItemFields";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import Button from "../../components/Button/Button";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

export default function EditFoundItemScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const route = useRoute();
  const form = useEditFoundForm(route.params?.id);

  if (form.loading || form.loadError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Edit Found Item" onBack={form.handleBack} />
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
      <Header title="Edit Found Item" onBack={form.handleBack} />

      <KeyboardAvoidingScreen>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FoundItemFields form={form} />

          {form.submitError ? <Text style={styles.submitErrorText}>{form.submitError}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="green"
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
    gap: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
});
