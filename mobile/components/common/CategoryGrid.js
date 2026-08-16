import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

export default function CategoryGrid({ categories, selected, onSelect, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.grid, style]}>
      {categories.map((cat) => {
        const isActive = selected === cat.label;
        return (
          <Pressable
            key={cat.label}
            onPress={() => onSelect(cat.label)}
            style={[styles.cell, isActive && styles.cellActive]}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{cat.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    width: "23%",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cellActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textLight,
    textAlign: "center",
  },
  labelActive: {
    color: colors.primary,
  },
});
