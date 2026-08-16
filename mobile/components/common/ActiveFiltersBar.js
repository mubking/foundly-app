import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import XIcon from "./XIcon";

/**
 * Removable-chip summary of the search filters currently applied, plus a
 * "Clear all" action — shown under SearchHeader whenever at least one
 * filter is active. Built on the same chip visual language as FilterChips,
 * but each chip here carries its own "x" (remove-this-one) instead of
 * being a mutually-exclusive picker.
 */
export default function ActiveFiltersBar({ chips, onRemove, onClearAll, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!chips.length) return null;

  return (
    <View style={[styles.row, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {chips.map((chip) => (
          <Pressable key={chip.key} style={styles.chip} onPress={() => onRemove(chip.key)}>
            <Text style={styles.chipLabel}>{chip.label}</Text>
            <XIcon size={12} color={colors.primary} />
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={onClearAll} hitSlop={8}>
        <Text style={styles.clearAll}>Clear all</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintDark,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  clearAll: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.danger,
  },
});
