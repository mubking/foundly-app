import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function NotificationCard({ icon, iconBg, iconColor, title, body, time, read, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, read ? styles.cardRead : { backgroundColor: `${iconColor}0D`, borderColor: `${iconColor}33` }, style]}
    >
      <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>{icon}</View>

      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {!read ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.body}>{body}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  time: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    marginTop: 6,
  },
});
