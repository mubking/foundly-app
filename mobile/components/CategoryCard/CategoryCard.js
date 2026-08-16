import React, { useMemo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

export default function CategoryCard({ emoji, label, count, onPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={styles.base}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
      {count != null ? <Text style={styles.count}>{count}</Text> : null}
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  base: {
    width: 68,
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.ink2,
    textAlign: "center",
  },
  count: {
    fontSize: 9,
    color: colors.subtle,
    marginTop: -4,
  },
});
