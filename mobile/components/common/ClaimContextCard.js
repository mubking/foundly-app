import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import Pill from "./Pill";
import SafeImage from "./SafeImage";
import CalendarIcon from "./CalendarIcon";
import EyeIcon from "./EyeIcon";
import Button from "../Button/Button";
import { CLAIM_STATUS_VARIANT as STATUS_VARIANT, CLAIM_STATUS_LABEL as STATUS_LABEL } from "../../constants/claimStatus";

/**
 * Pinned at the top of a claim conversation — permanent context for which
 * claim it's about, since a chat thread's own scroll history isn't a
 * reliable place to establish that. `onViewEvidence` only renders when
 * `hasEvidence` (a proof photo was actually attached) and `isOwnerViewing`
 * (only the item's owner reviews evidence; the claimant already knows what
 * they submitted) are both true — mirrors ClaimDetailsScreen's own
 * "Evidence" section gating.
 */
export default function ClaimContextCard({
  image,
  title,
  status,
  submittedTime,
  hasEvidence,
  isOwnerViewing,
  onViewItem,
  onViewEvidence,
  style,
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.row}>
        <SafeImage source={image} style={styles.thumb} iconSize={20} />

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Pill label={STATUS_LABEL[status]} variant={STATUS_VARIANT[status]} style={styles.statusPill} />
          </View>
          <View style={styles.metaRow}>
            <CalendarIcon size={12} color={colors.subtle} />
            <Text style={styles.metaText}>Submitted {submittedTime}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Button variant="outline" size="sm" style={styles.actionButton} onPress={onViewItem}>
          View Item
        </Button>
        {hasEvidence && isOwnerViewing ? (
          <Button
            variant="outline"
            size="sm"
            style={styles.actionButton}
            icon={<EyeIcon size={14} color={colors.primary} />}
            onPress={onViewEvidence}
          >
            View Evidence
          </Button>
        ) : null}
      </View>
    </Card>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    padding: 12,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  statusPill: {
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textLight,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
