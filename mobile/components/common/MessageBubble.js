import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import colors from "../../constants/colors";
import Avatar from "../Avatar/Avatar";
import CheckIcon from "./CheckIcon";

export default function MessageBubble({ text, time, isMe, read, avatar, avatarInitials }) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      {!isMe ? <Avatar size={30} initials={avatarInitials} source={avatar} /> : null}

      <View style={[styles.column, isMe && styles.columnMe]}>
        {isMe ? (
          <LinearGradient
            colors={[colors.primary, colors.primaryHover]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleMe]}
          >
            <Text style={styles.textMe}>{text}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleThem]}>
            <Text style={styles.textThem}>{text}</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.time}>{time}</Text>
          {isMe && read ? <CheckIcon size={12} color={colors.primary} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowMe: {
    flexDirection: "row-reverse",
  },
  column: {
    maxWidth: "76%",
    alignItems: "flex-start",
    gap: 4,
  },
  columnMe: {
    alignItems: "flex-end",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleMe: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 3,
  },
  bubbleThem: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.background,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  textMe: {
    fontSize: 14,
    lineHeight: 22,
    color: "#fff",
  },
  textThem: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  time: {
    fontSize: 12,
    color: colors.subtle,
  },
});
