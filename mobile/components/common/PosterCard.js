import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Avatar from "../Avatar/Avatar";
import MessageCircleIcon from "./MessageCircleIcon";
import Card from "./Card";

function getInitials(owner) {
  return `${owner?.firstName?.[0] || ""}${owner?.lastName?.[0] || ""}`.toUpperCase();
}

/**
 * Item Details' "who posted this" card. Unlike the mock-data FinderCard,
 * this only shows what the backend actually returns for an item's
 * owner (firstName/lastName) — no rating or return count, since neither
 * exists on the User model.
 */
export default function PosterCard({ owner, label, onMessage, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const name = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || "Unknown user";

  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <Avatar size={48} initials={getInitials(owner)} />
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        {onMessage ? (
          <Pressable style={styles.messageButton} onPress={onMessage}>
            <MessageCircleIcon size={18} color={colors.primary} />
          </Pressable>
        ) : null}
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
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryTint,
  },
});
