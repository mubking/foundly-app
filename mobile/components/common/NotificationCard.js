import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Avatar from "../Avatar/Avatar";

/**
 * `avatar`/`avatarInitials` render the sender's photo instead of the
 * type-based `icon` badge — only ever passed for "new_message" (see
 * NotificationsScreen), which is the one type with a real person, not just
 * an event type, behind it. `meta` is an optional extra line (e.g. "Re:
 * {item title}") below `body`.
 */
export default function NotificationCard({
  icon,
  iconBg,
  iconColor,
  avatar,
  avatarInitials,
  title,
  body,
  meta,
  time,
  read,
  onPress,
  style,
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, read ? styles.cardRead : { backgroundColor: `${iconColor}0D`, borderColor: `${iconColor}33` }, style]}
    >
      {avatarInitials !== undefined ? (
        <Avatar size={40} initials={avatarInitials} source={avatar} />
      ) : (
        <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>{icon}</View>
      )}

      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {!read ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.body}>{body}</Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <Text style={styles.time}>{time}</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardRead: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textLight,
  },
  meta: {
    fontSize: 11,
    fontStyle: "italic",
    color: colors.subtle,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    marginTop: 6,
  },
});
