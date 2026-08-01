import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import Avatar from "../Avatar/Avatar";
import Pill from "./Pill";
import StarIcon from "./StarIcon";
import MessageCircleIcon from "./MessageCircleIcon";
import Card from "./Card";

export default function FinderCard({ finder, onMessage, style }) {
  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.label}>Found by</Text>

      <View style={styles.row}>
        <Avatar size={48} initials={finder.initials} source={finder.avatar} ring />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{finder.name}</Text>
            <View style={styles.ratingRow}>
              <StarIcon size={12} color={colors.secondary} fill={colors.secondary} />
              <Text style={styles.rating}>{finder.rating}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Pill label="Verified Hero" variant="green" />
            <Text style={styles.returns}>{finder.returns} returns</Text>
          </View>
        </View>

        <Pressable style={styles.messageButton} onPress={onMessage}>
          <MessageCircleIcon size={18} color={colors.primary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  returns: {
    fontSize: 12,
    color: colors.textLight,
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
