import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

import InfoRow from "./InfoRow";
import GiftIcon from "./GiftIcon";
import DollarSignIcon from "./DollarSignIcon";
import Input from "../Input/Input";
import ItemPreviewCard from "./ItemPreviewCard";
import ShieldIcon from "./ShieldIcon";

/** Step 3 of Report Lost Item: optional reward, live preview, and submit error. */
export default function LostReviewStep({ form }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const previewImage = form.imagePicker.images[0] ? { uri: form.imagePicker.images[0].uri } : null;

  return (
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
          value={form.reward}
          onChangeText={form.setReward}
          keyboardType="numeric"
          icon={<DollarSignIcon size={17} color={colors.textLight} />}
          hint="Optional — you only pay if the item is returned"
        />
      </View>

      <View>
        <Text style={styles.sectionLabel}>Preview</Text>
        <ItemPreviewCard
          image={previewImage}
          type="lost"
          title={form.title || "Your Item"}
          reward={form.reward}
          location={form.location || "Location not set"}
          time="Just now"
        />
      </View>

      <View style={styles.trustNote}>
        <ShieldIcon size={18} color={colors.success} />
        <Text style={styles.trustText}>
          Your post is reviewed for accuracy. False reports may result in account suspension.
        </Text>
      </View>

      {form.submitError ? <Text style={styles.submitErrorText}>{form.submitError}</Text> : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  stepGap: {
    gap: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
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
  submitErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
});
