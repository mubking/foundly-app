import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { useReportLostForm, TOTAL_STEPS } from "../../hooks/useReportLostForm";

import Header from "../../components/Header/Header";
import StepProgress from "../../components/common/StepProgress";
import LostDetailsStep from "../../components/common/LostDetailsStep";
import LostLocationStep from "../../components/common/LostLocationStep";
import LostReviewStep from "../../components/common/LostReviewStep";
import ArrowRightIcon from "../../components/common/ArrowRightIcon";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import Button from "../../components/Button/Button";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

const STEP_LABELS = ["Photos & Details", "Location & Time", "Review & Post"];

export default function ReportLostScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const form = useReportLostForm();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Report Lost Item" subtitle={`Step ${form.step} of ${TOTAL_STEPS}`} onBack={form.handleBack} />

      <StepProgress step={form.step} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} style={styles.progress} />

      <KeyboardAvoidingScreen>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {form.step === 1 ? <LostDetailsStep form={form} /> : null}
          {form.step === 2 ? <LostLocationStep form={form} /> : null}
          {form.step === 3 ? <LostReviewStep form={form} /> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          {form.submitError ? <Text style={styles.submitErrorText}>{form.submitError}</Text> : null}
          {form.step < TOTAL_STEPS ? (
            <Button fullWidth onPress={form.handlePrimaryAction} iconRight={<ArrowRightIcon size={18} color="#fff" />}>
              Continue
            </Button>
          ) : (
            <Button
              fullWidth
              disabled={form.submitting}
              onPress={form.handlePrimaryAction}
              icon={<CheckCircleIcon size={18} color="#fff" />}
            >
              {form.submitting
                ? form.uploadProgress > 0
                  ? `Publishing… ${form.uploadProgress}%`
                  : "Publishing…"
                : "Publish Report"}
            </Button>
          )}
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
  progress: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  submitErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
});
