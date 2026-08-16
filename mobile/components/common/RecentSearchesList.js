import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import ClockIcon from "./ClockIcon";
import XIcon from "./XIcon";

/**
 * Shown above results while the search box is empty/focused: the caller's
 * recent searches (Phase 6), each removable individually, plus a "Clear
 * all" action. Tapping a row runs that search again.
 */
export default function RecentSearchesList({ recentSearches, onSelect, onRemove, onClearAll, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!recentSearches.length) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent searches</Text>
        <Pressable onPress={onClearAll} hitSlop={8}>
          <Text style={styles.clearAll}>Clear all</Text>
        </Pressable>
      </View>

      {recentSearches.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <Pressable style={styles.rowMain} onPress={() => onSelect(entry.query)}>
            <ClockIcon size={14} color={colors.subtle} />
            <Text style={styles.rowLabel} numberOfLines={1}>
              {entry.query}
            </Text>
          </Pressable>
          <Pressable onPress={() => onRemove(entry.id)} hitSlop={8}>
            <XIcon size={14} color={colors.subtle} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtle,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  clearAll: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
});
