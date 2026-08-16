import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { getInitials } from "../../utils/initials";
import Avatar from "../Avatar/Avatar";
import Card from "./Card";
import Pill from "./Pill";

/**
 * Claim Details' "who's claiming this" card: the claimant's identity and
 * verification status, if any (`User.isVerified` — see backend/src/models/User.js).
 * No message button here — Claim Details has its own "Message Claimant"
 * action, so this card stays purely identity, not another entry point into
 * the same action.
 */
export default function ClaimantCard({ claimant, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const name = [claimant?.firstName, claimant?.lastName].filter(Boolean).join(" ") || "Unknown user";

  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.label}>Claimed By</Text>

      <View style={styles.row}>
        <Avatar size={48} initials={getInitials(claimant)} source={claimant?.avatar} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {claimant?.isVerified ? (
            <Pill
              label="Verified"
              variant="green"
              style={styles.verifiedPill}
              dot={false}
            />
          ) : (
            <Text style={styles.unverifiedText}>Not yet verified</Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  verifiedPill: {
    alignSelf: "flex-start",
  },
  unverifiedText: {
    fontSize: 12,
    color: colors.textLight,
  },
});
