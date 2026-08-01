import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";

const VARIANTS = {
  primary: { bg: colors.primaryTint, text: colors.primary },
  green: { bg: colors.greenTint, text: "#16A34A" },
  amber: { bg: colors.amberTint, text: "#D97706" },
  red: { bg: colors.redTint, text: colors.danger },
  purple: { bg: "#EDE9FE", text: colors.purple },
  muted: { bg: colors.surface, text: colors.textLight },
};

export default function Pill({ label, variant = "primary", dot = false, style }) {
  const v = VARIANTS[variant];

  return (
    <View style={[styles.base, { backgroundColor: v.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: v.text }]} /> : null}
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
