import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import InfoRow from "./InfoRow";
import ShieldIcon from "./ShieldIcon";
import Input from "../Input/Input";

/** Step 1 of Claim This Item: the claim message and an optional reward. */
export default function ClaimMessageStep({ form }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.stepGap}>
      <InfoRow
        icon={<ShieldIcon size={20} color={colors.primary} />}
        titleColor={colors.primaryLight}
        title="Tell the Owner Why It's Yours"
        subtitle="Your message and any evidence are only sent to the poster once you submit."
        subtitleColor={colors.primary}
        style={styles.infoBanner}
      />

      <Input
        label="Your Message"
        placeholder="Describe how you know this item is yours…"
        value={form.message}
        onChangeText={form.setMessage}
        error={form.errors.message}
        multiline
      />

      <Input
        label="Reward (optional)"
        placeholder="e.g. 50"
        value={form.reward}
        onChangeText={form.setReward}
        error={form.errors.reward}
        keyboardType="numeric"
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  stepGap: {
    gap: 20,
  },
  infoBanner: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
  },
});
