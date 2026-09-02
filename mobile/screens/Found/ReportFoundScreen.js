import React, { useMemo } from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useReportFoundForm } from "../../hooks/useReportFoundForm";

import Header from "../../components/Header/Header";
import AIScannerCard from "../../components/common/AIScannerCard";
import FoundItemFields from "../../components/common/FoundItemFields";
import UploadIcon from "../../components/common/UploadIcon";
import Button from "../../components/Button/Button";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

export default function ReportFoundScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const form = useReportFoundForm();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Upload Found Item" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingScreen>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FoundItemFields form={form}>
            <AIScannerCard
              status={form.aiScan.status}
              error={form.aiScan.error}
              onScan={form.aiScan.scan}
              detectedTitle={form.title}
              detectedSubtitle={form.category}
            />
          </FoundItemFields>

          {form.submitError ? <Text style={styles.submitErrorText}>{form.submitError}</Text> : null}

          <Button
            variant="green"
            fullWidth
            icon={<UploadIcon size={18} color="#fff" />}
            disabled={form.submitting}
            onPress={form.handleSubmit}
          >
            {form.submitting
              ? form.uploadProgress > 0
                ? `Publishing… ${form.uploadProgress}%`
                : "Publishing…"
              : "Publish Found Item"}
          </Button>
        </ScrollView>
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
    paddingBottom: 32,
    gap: 20,
  },
  submitErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
});
