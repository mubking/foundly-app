import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Pill from "./Pill";
import MapPinIcon from "./MapPinIcon";
import ClockIcon from "./ClockIcon";
import FlagIcon from "./FlagIcon";
import PosterCard from "./PosterCard";

/**
 * Item Details' content below the hero: location/time bar, reward pill,
 * poster card, description, and (non-owners only — reporting your own
 * item always 400s server-side) the report link.
 */
export default function ItemDetailsBody({ item, posterLabel, isOwner, onMessage, onReportPress, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.content, style]}>
      <View style={styles.metaRow}>
        <View style={[styles.metaItem, styles.metaItemGrow]}>
          <MapPinIcon size={15} color={colors.danger} />
          <Text style={styles.metaLocation}>{item.location}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <ClockIcon size={15} color={colors.subtle} />
          <Text style={styles.metaTime}>{item.date}</Text>
        </View>
      </View>

      {item.reward ? <Pill label={`$${item.reward} reward`} variant="amber" style={styles.rewardPill} /> : null}

      <PosterCard owner={item.owner} label={posterLabel} onMessage={onMessage} />

      <View>
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {!isOwner ? (
        <Pressable style={styles.reportLink} onPress={onReportPress}>
          <FlagIcon size={15} color={colors.subtle} />
          <Text style={styles.reportText}>Report this listing as incorrect</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaItemGrow: {
    flex: 1,
  },
  metaLocation: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink2,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  metaTime: {
    fontSize: 14,
    color: colors.textLight,
  },
  rewardPill: {
    alignSelf: "flex-start",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 24,
  },
  reportLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.subtle,
  },
});
