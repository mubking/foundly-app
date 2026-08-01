import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import UploadIcon from "./UploadIcon";

export default function UploadPlaceholder({ title, subtitle, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.wrap, style]}>
      <View style={styles.iconBadge}>
        <UploadIcon size={22} color={colors.textLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 176,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLight,
  },
  subtitle: {
    fontSize: 12,
    color: colors.subtle,
  },
});
