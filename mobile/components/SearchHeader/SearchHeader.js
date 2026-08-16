import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import ArrowLeftIcon from "../common/ArrowLeftIcon";
import FilterIcon from "../common/FilterIcon";
import BarChartIcon from "../common/BarChartIcon";
import GridIcon from "../common/GridIcon";
import MapIcon from "../common/MapIcon";
import BookmarkIcon from "../common/BookmarkIcon";
import SearchInput from "../common/SearchInput";
import ViewToggle from "../common/ViewToggle";

const VIEW_OPTIONS = [
  { value: "list", icon: BarChartIcon },
  { value: "grid", icon: GridIcon },
  { value: "map", icon: MapIcon },
];

/**
 * Search screen's top block: back button, search box (with a suggestions
 * dropdown anchored by the caller), a filter button that opens the filter
 * sheet, a shortcut to saved searches, and the results count + list/grid/map
 * toggle. Purely presentational — SearchScreen owns all the state this
 * reflects and renders the filter sheet / suggestions dropdown itself.
 */
export default function SearchHeader({
  onBack,
  query,
  onQueryChange,
  onQueryFocus,
  onQueryBlur,
  onOpenFilters,
  activeFilterCount,
  onOpenSavedSearches,
  resultsTotal,
  view,
  onViewChange,
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.header}>
      <View style={styles.searchRow}>
        <Pressable style={styles.iconButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeftIcon size={20} color={colors.text} />
        </Pressable>

        <SearchInput
          value={query}
          onChangeText={onQueryChange}
          onFocus={onQueryFocus}
          onBlur={onQueryBlur}
          placeholder="Search items, locations…"
        />

        <Pressable
          style={styles.iconButton}
          onPress={onOpenSavedSearches}
          accessibilityRole="button"
          accessibilityLabel="Saved searches"
        >
          <BookmarkIcon size={18} color={colors.ink2} />
        </Pressable>

        <Pressable
          style={[styles.iconButton, activeFilterCount > 0 && styles.iconButtonActive]}
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <FilterIcon size={18} color={activeFilterCount > 0 ? "#fff" : colors.ink2} />
          {activeFilterCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          <Text style={styles.resultsCount}>{resultsTotal}</Text> results{query ? ` for "${query}"` : " near you"}
        </Text>
        <ViewToggle options={VIEW_OPTIONS} active={view} onChange={onViewChange} />
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  iconButtonActive: {
    backgroundColor: colors.primary,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
  },
  resultsCount: {
    color: colors.text,
    fontWeight: "700",
  },
});
