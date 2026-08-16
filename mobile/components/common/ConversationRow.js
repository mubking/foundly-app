import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { getInitials } from "../../utils/initials";
import Card from "./Card";
import Avatar from "../Avatar/Avatar";

/**
 * One row in the Conversations inbox: the other participant, their last
 * message, when, and an unread count badge. `conversation.participant` can
 * be `null` (see services/chat.js) — falls back to "Unknown user" rather
 * than crashing.
 */
export default function ConversationRow({ conversation, onPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { participant, lastMessage, unreadCount, time } = conversation;
  const name = participant ? `${participant.firstName} ${participant.lastName}`.trim() : "Unknown user";
  const preview = lastMessage?.text || "No messages yet";
  const hasUnread = unreadCount > 0;

  return (
    <Card onPress={onPress} style={styles.card}>
      <Avatar size={48} initials={getInitials(participant)} source={participant?.avatar} />

      <View style={styles.textWrap}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
            {preview}
          </Text>
          {hasUnread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  nameUnread: {
    fontWeight: "800",
  },
  time: {
    fontSize: 12,
    color: colors.subtle,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
  },
  previewUnread: {
    color: colors.ink2,
    fontWeight: "600",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
});
