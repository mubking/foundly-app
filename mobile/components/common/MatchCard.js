import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import Pill from "./Pill";
import CheckIcon from "./CheckIcon";
import SafeImage from "./SafeImage";
import Button from "../Button/Button";

const HIGH_CONFIDENCE_THRESHOLD = 80;
const POSSIBLE_THRESHOLD = 50;

function bandFor(score) {
  if (score >= HIGH_CONFIDENCE_THRESHOLD) return { label: "Very likely", variant: "green" };
  if (score >= POSSIBLE_THRESHOLD) return { label: "Possible match", variant: "amber" };
  return { label: "Weak match", variant: "muted" };
}

function ItemThumb({ item, colors, styles }) {
  if (!item) return null;
  return (
    <View style={styles.thumb}>
      <SafeImage source={item.image} style={styles.thumbImage} iconSize={18} />
      <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} style={styles.thumbPill} />
      <Text style={styles.thumbTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.thumbMeta, { color: colors.textLight }]} numberOfLines={1}>{item.location}</Text>
    </View>
  );
}

/**
 * One entry in the Matches screen's High Confidence / Possible / Dismissed
 * lists: the confidence score, why it matched (Phase 4's reasons), previews
 * of both the lost and found item, and the three actions the spec calls
 * for. Only pending/viewed matches get action buttons — a dismissed or
 * already-claimed match is display-only.
 */
export default function MatchCard({ match, isUpdating, onViewItem, onStartClaim, onDismiss }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const band = match.status === "dismissed" ? { label: "Dismissed", variant: "muted" } : bandFor(match.score);
  const otherItem = match.role === "lost" ? match.foundItem : match.lostItem;
  const isActionable = match.status === "pending" || match.status === "viewed";

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Pill label={`${match.score}% · ${band.label}`} variant={band.variant} />
        <Text style={styles.time}>{match.time}</Text>
      </View>

      <View style={styles.thumbRow}>
        <ItemThumb item={match.lostItem} colors={colors} styles={styles} />
        <ItemThumb item={match.foundItem} colors={colors} styles={styles} />
      </View>

      {match.reasons?.length ? (
        <View style={styles.reasons}>
          {match.reasons.map((reason) => (
            <View key={reason} style={styles.reasonRow}>
              <CheckIcon size={14} color={colors.success} strokeWidth={3} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button variant="outline" size="sm" style={styles.actionButton} onPress={() => onViewItem(otherItem)}>
          View Item
        </Button>
        {isActionable ? (
          <>
            <Button
              variant="primary"
              size="sm"
              style={styles.actionButton}
              disabled={isUpdating}
              onPress={() => onStartClaim(match)}
            >
              Start Claim
            </Button>
            <Button
              variant="surface"
              size="sm"
              style={styles.actionButton}
              disabled={isUpdating}
              onPress={() => onDismiss(match.id)}
            >
              Dismiss
            </Button>
          </>
        ) : null}
      </View>
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: {
    fontSize: 11,
    color: colors.textLight,
  },
  thumbRow: {
    flexDirection: "row",
    gap: 10,
  },
  thumb: {
    flex: 1,
    minWidth: 0,
  },
  thumbImage: {
    width: "100%",
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  thumbPill: {
    position: "absolute",
    top: 6,
    left: 6,
  },
  thumbTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
  },
  thumbMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  reasons: {
    gap: 4,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reasonText: {
    fontSize: 12,
    color: colors.ink2,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
