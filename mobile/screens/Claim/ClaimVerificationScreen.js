import React, { useEffect, useState, useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useClaimForm } from "../../hooks/useClaimForm";

import Header from "../../components/Header/Header";
import ClaimMessageStep from "../../components/common/ClaimMessageStep";
import ClaimEvidenceStep from "../../components/common/ClaimEvidenceStep";
import ClaimSuccessStep from "../../components/common/ClaimSuccessStep";
import ArrowLeftIcon from "../../components/common/ArrowLeftIcon";
import ArrowRightIcon from "../../components/common/ArrowRightIcon";
import Button from "../../components/Button/Button";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

export default function ClaimVerificationScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated } = useAuth();
  const { itemId, itemType, itemTitle } = route.params || {};
  const [step, setStep] = useState(1);

  const form = useClaimForm({ itemId, itemType });

  // Only authenticated users can submit a claim. The Item Details button
  // already gates this, but this screen enforces it directly too, in case
  // it's ever reached another way (deep link, back navigation).
  useEffect(() => {
    if (!isAuthenticated) navigation.replace("Login");
  }, [isAuthenticated, navigation]);

  // A failed submit means message/reward were invalid — both live on step
  // 1, so bounce back there to surface the inline errors.
  useEffect(() => {
    if (Object.keys(form.errors).length > 0) setStep(1);
  }, [form.errors]);

  useEffect(() => {
    if (form.submitted) setStep(3);
  }, [form.submitted]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Claim This Item" subtitle={itemTitle} onBack={() => navigation.goBack()} />

      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.track}>
            <View style={[styles.fill, { width: s <= step ? "100%" : "0%" }]} />
          </View>
        ))}
      </View>

      <KeyboardAvoidingScreen>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? <ClaimMessageStep form={form} /> : null}
          {step === 2 ? <ClaimEvidenceStep form={form} /> : null}
          {step === 3 ? <ClaimSuccessStep hasProof={form.imagePicker.images.length > 0} /> : null}
        </ScrollView>

        <View style={styles.footer}>
          {step === 2 ? (
            <Pressable
              style={styles.backStepButton}
              onPress={() => setStep(1)}
              accessibilityRole="button"
              accessibilityLabel="Back to previous step"
            >
              <ArrowLeftIcon size={20} color={colors.text} />
            </Pressable>
          ) : null}

          {step === 1 ? (
            <Button fullWidth onPress={() => setStep(2)} iconRight={<ArrowRightIcon size={18} color="#fff" />}>
              Continue
            </Button>
          ) : step === 2 ? (
            <Button
              style={styles.primaryButton}
              disabled={form.submitting}
              onPress={form.handleSubmit}
              iconRight={<ArrowRightIcon size={18} color="#fff" />}
            >
              {form.submitting
                ? form.uploadProgress > 0
                  ? `Submitting… ${form.uploadProgress}%`
                  : "Submitting…"
                : "Submit Claim"}
            </Button>
          ) : (
            <Button fullWidth onPress={() => navigation.goBack()}>
              Done
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
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backStepButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  primaryButton: {
    flex: 1,
  },
});
