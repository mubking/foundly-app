import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import ChevronRightIcon from "./ChevronRightIcon";
import SafeImage from "./SafeImage";
import Pill from "./Pill";

const STATUS_VARIANT = { open: "amber", matched: "purple", claimed: "primary", closed: "green" };
const STATUS_LABEL = { open: "Active", matched: "Possible Match", claimed: "Claim Pending", closed: "Returned" };

/**
 * Pinned "which item this conversation is about" card, shown at the top of
 * a chat thread — always the item's name, its status (if known — the inbox
 * list doesn't populate one, see ChatScreen's comment), and a tap target to
 * open the full listing, so the conversation's context is never ambiguous.
 */
export default function ChatItemContext({ image, title, status, subtitle = "View Item", onPress, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.wrap, style]}>
      <SafeImage source={image} style={styles.thumb} iconSize={16} />
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {status && STATUS_LABEL[status] ? (
            <Pill label={STATUS_LABEL[status]} variant={STATUS_VARIANT[status]} style={styles.statusPill} />
          ) : null}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRightIcon size={15} color={colors.primary} />
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintDark,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  statusPill: {
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
});
