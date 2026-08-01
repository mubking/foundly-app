import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import images from "../../constants/images";
import { CATEGORIES } from "../../constants/homeMockData";

import Header from "../../components/Header/Header";
import StepProgress from "../../components/common/StepProgress";
import UploadZone from "../../components/common/UploadZone";
import InfoRow from "../../components/common/InfoRow";
import SparklesIcon from "../../components/common/SparklesIcon";
import Input from "../../components/Input/Input";
import CategoryGrid from "../../components/common/CategoryGrid";
import LocationMapPreview from "../../components/common/LocationMapPreview";
import CalendarIcon from "../../components/common/CalendarIcon";
import ClockIcon from "../../components/common/ClockIcon";
import MapPinIcon from "../../components/common/MapPinIcon";
import GiftIcon from "../../components/common/GiftIcon";
import DollarSignIcon from "../../components/common/DollarSignIcon";
import ItemPreviewCard from "../../components/common/ItemPreviewCard";
import ShieldIcon from "../../components/common/ShieldIcon";
import ArrowRightIcon from "../../components/common/ArrowRightIcon";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import Button from "../../components/Button/Button";

const STEP_LABELS = ["Photos & Details", "Location & Time", "Review & Post"];
const TOTAL_STEPS = 3;

export default function ReportLostScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("Black Leather Wallet");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [reward, setReward] = useState("");

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
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
      <Header title="Report Lost Item" subtitle={`Step ${step} of ${TOTAL_STEPS}`} onBack={handleBack} />

      <StepProgress step={step} totalSteps={TOTAL_STEPS} labels={STEP_LABELS} style={styles.progress} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <View style={styles.stepGap}>
            <UploadZone />

            <InfoRow
              icon={<SparklesIcon size={16} color={colors.purple} />}
              iconBg="#EDE9FE"
              title="AI Description"
              titleColor={colors.purple}
              subtitle="Upload a photo and our AI auto-fills the title, category, and unique identifiers."
              style={styles.infoBanner}
            />

            <Input
              label="Item Title"
              placeholder="e.g. Black leather bifold wallet"
              value={title}
              onChangeText={setTitle}
            />

            <View>
              <Text style={styles.sectionLabel}>Category</Text>
              <CategoryGrid categories={CATEGORIES} selected={category} onSelect={setCategory} />
            </View>

            <Input
              label="Description"
              placeholder="Color, brand, distinguishing features…"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepGap}>
            <LocationMapPreview label="Pin Last Location" />

            <Input
              label="Last Seen Location"
              placeholder="Central Park, near the fountain"
              value={location}
              onChangeText={setLocation}
              icon={<MapPinIcon size={17} color={colors.textLight} />}
            />

            <View style={styles.row}>
              <Input
                label="Date Lost"
                placeholder="Jul 28, 2025"
                icon={<CalendarIcon size={17} color={colors.textLight} />}
                style={styles.rowItem}
              />
              <Input
                label="Time (approx)"
                placeholder="3:00 PM"
                icon={<ClockIcon size={17} color={colors.textLight} />}
                style={styles.rowItem}
              />
            </View>

            <Input label="Additional Context" placeholder="Any circumstances, landmarks, or witnesses…" multiline />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepGap}>
            <View style={styles.rewardCard}>
              <InfoRow
                icon={<GiftIcon size={18} color="#fff" />}
                iconBg={colors.secondary}
                title="Offer a Reward"
                titleColor="#D97706"
                subtitle="Items with rewards get 3× more responses"
                subtitleColor="#D97706"
                style={styles.rewardInfoRow}
              />
              <Input
                placeholder="e.g. 50"
                value={reward}
                onChangeText={setReward}
                keyboardType="numeric"
                icon={<DollarSignIcon size={17} color={colors.textLight} />}
                hint="Optional — you only pay if the item is returned"
              />
            </View>

            <View>
              <Text style={styles.sectionLabel}>Preview</Text>
              <ItemPreviewCard
                image={images.items.wallet}
                type="lost"
                title={title || "Your Item"}
                reward={reward}
                location="Times Square, NY"
                time="Just now"
              />
            </View>

            <View style={styles.trustNote}>
              <ShieldIcon size={18} color={colors.success} />
              <Text style={styles.trustText}>
                Your post is reviewed for accuracy. False reports may result in account suspension.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <Button fullWidth onPress={handlePrimaryAction} iconRight={<ArrowRightIcon size={18} color="#fff" />}>
            Continue
          </Button>
        ) : (
          <Button fullWidth onPress={handlePrimaryAction} icon={<CheckCircleIcon size={18} color="#fff" />}>
            Publish Report
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
  stepGap: {
    gap: 20,
  },
  infoBanner: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  rewardCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.amberTint,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    gap: 12,
  },
  rewardInfoRow: {
    marginBottom: 0,
  },
  trustNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textLight,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
