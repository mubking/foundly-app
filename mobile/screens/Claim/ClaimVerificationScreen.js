import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";

import Header from "../../components/Header/Header";
import InfoRow from "../../components/common/InfoRow";
import ShieldIcon from "../../components/common/ShieldIcon";
import NumberedQuestionCard from "../../components/common/NumberedQuestionCard";
import UploadPlaceholder from "../../components/common/UploadPlaceholder";
import Input from "../../components/Input/Input";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import StatusTimeline from "../../components/common/StatusTimeline";
import ArrowLeftIcon from "../../components/common/ArrowLeftIcon";
import ArrowRightIcon from "../../components/common/ArrowRightIcon";
import Button from "../../components/Button/Button";

const TOTAL_STEPS = 3;

const QUESTIONS = [
  { question: "What color is the phone case?", hint: "Answer privately — not shown to finder" },
  { question: "What app icon is in the top-left corner of the screen?", hint: "Be as specific as possible" },
];

const APPROVAL_STEPS = [
  { label: "Claim received", sub: "Just now", done: true },
  { label: "Answers reviewed by AI", sub: "~2 minutes", done: true },
  { label: "Evidence verification", sub: "~6 hours", done: false, active: true },
  { label: "Finder notified", sub: "After verification", done: false },
  { label: "Item returned", sub: "Arranged by both parties", done: false },
];

export default function ClaimVerificationScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState(["", ""]);
  const [notes, setNotes] = useState("");

  const setAnswer = (index, value) => {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const handlePrimaryAction = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      navigation.navigate("Home");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Secure Claim" subtitle="Your answers are encrypted" onBack={() => navigation.goBack()} />

      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.track}>
            <View style={[styles.fill, { width: s <= step ? "100%" : "0%" }]} />
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <View style={styles.stepGap}>
            <InfoRow
              icon={<ShieldIcon size={20} color={colors.primary} />}
              title="How Secure Verification Works"
              titleColor={colors.primaryLight}
              subtitle="Answer questions only the true owner would know. The finder cannot see your responses."
              subtitleColor={colors.primary}
              style={styles.infoBanner}
            />

            <View style={styles.stepGap}>
              {QUESTIONS.map((item, index) => (
                <NumberedQuestionCard
                  key={item.question}
                  number={index + 1}
                  question={item.question}
                  value={answers[index]}
                  onChangeText={(value) => setAnswer(index, value)}
                  hint={item.hint}
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepGap}>
            <View>
              <Text style={styles.sectionTitle}>Upload Evidence</Text>
              <Text style={styles.sectionBody}>
                Provide photos or documents proving ownership — receipts, previous screenshots, serial number
                photos, etc.
              </Text>
            </View>

            <UploadPlaceholder title="Tap to upload evidence" subtitle="Photos, PDFs • Max 20MB" />

            <Input
              label="Supporting Notes"
              placeholder="Any additional proof of ownership…"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.successWrap}>
            <View style={styles.successBadge}>
              <CheckCircleIcon size={48} color={colors.success} strokeWidth={2} />
            </View>

            <View style={styles.successTextWrap}>
              <Text style={styles.successTitle}>Claim Submitted</Text>
              <Text style={styles.successBody}>
                Your claim is under review. We'll notify you within 24 hours.
              </Text>
            </View>

            <StatusTimeline steps={APPROVAL_STEPS} title="Approval Progress" size="sm" style={styles.timeline} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && step < TOTAL_STEPS ? (
          <Pressable style={styles.backStepButton} onPress={() => setStep((s) => s - 1)}>
            <ArrowLeftIcon size={20} color={colors.text} />
          </Pressable>
        ) : null}

        {step < TOTAL_STEPS ? (
          <Button
            fullWidth={step === 1}
            onPress={handlePrimaryAction}
            iconRight={<ArrowRightIcon size={18} color="#fff" />}
            style={step > 1 ? styles.primaryButton : undefined}
          >
            Continue
          </Button>
        ) : (
          <Button fullWidth onPress={handlePrimaryAction}>
            Go to Home
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  stepGap: {
    gap: 20,
  },
  infoBanner: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },
  successWrap: {
    alignItems: "center",
    gap: 20,
    paddingVertical: 32,
  },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenTint,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
  successTextWrap: {
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  successBody: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
    textAlign: "center",
  },
  timeline: {
    width: "100%",
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
