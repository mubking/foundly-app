import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import Pill from "./Pill";
import CheckIcon from "./CheckIcon";
import XIcon from "./XIcon";
import MessageCircleIcon from "./MessageCircleIcon";
import Button from "../Button/Button";
import SafeImage from "./SafeImage";
import { optimizeImageUrl } from "../../utils/cloudinaryImage";
import { CLAIM_STATUS_VARIANT as STATUS_VARIANT, CLAIM_STATUS_LABEL as STATUS_LABEL } from "../../constants/claimStatus";

/**
 * One claim in the "Claims on My Items" list: which item it's against, who
 * filed it, their message/reward/proof photo, a direct way to message that
 * claimant, and — while pending — Accept / Reject actions.
 */
export default function ClaimCard({ claim, isReviewing, onApprove, onReject, onMessage, onPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const claimantName =
    [claim.claimant?.firstName, claim.claimant?.lastName].filter(Boolean).join(" ") || "Unknown user";

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {claim.item?.title}
          </Text>
          <Text style={styles.claimant}>Claim by {claimantName}</Text>
        </View>
        <Pill label={STATUS_LABEL[claim.status]} variant={STATUS_VARIANT[claim.status]} />
        {onMessage ? (
          <Pressable
            style={styles.messageButton}
            onPress={onMessage}
            accessibilityRole="button"
            accessibilityLabel={`Message ${claimantName}`}
            hitSlop={4}
          >
            <MessageCircleIcon size={16} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.message}>{claim.message}</Text>

      {claim.reward ? (
        <Pill label={`$${claim.reward} reward offered`} variant="amber" style={styles.rewardPill} />
      ) : null}

      {claim.proofImage ? (
        <SafeImage
          source={{ uri: optimizeImageUrl(claim.proofImage, "detail") }}
          style={styles.proofImage}
        />
      ) : null}

      {claim.status === "pending" ? (
        <View style={styles.actions}>
          <Button
            variant="red"
            size="sm"
            style={styles.actionButton}
            disabled={isReviewing}
            icon={<XIcon size={14} color="#fff" strokeWidth={3} />}
            onPress={onReject}
          >
            Reject
          </Button>
          <Button
            variant="green"
            size="sm"
            style={styles.actionButton}
            disabled={isReviewing}
            icon={<CheckIcon size={14} color="#fff" strokeWidth={3} />}
            onPress={onApprove}
          >
            {isReviewing ? "Updating…" : "Accept"}
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  claimant: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  messageButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryTint,
  },
  message: {
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 20,
  },
  rewardPill: {
    alignSelf: "flex-start",
  },
  proofImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
