import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Dimensions, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { ITEM_CATEGORIES } from "../../constants/itemCategories";
import Input from "../Input/Input";
import Button from "../Button/Button";
import FilterChips from "./FilterChips";
import CategoryGrid from "./CategoryGrid";
import DateField from "./DateField";
import Toggle from "./Toggle";

const TYPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Lost", value: "lost" },
  { label: "Found", value: "found" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Closest Match", value: "closest_match" },
  { label: "Highest Reward", value: "highest_reward" },
  { label: "Nearest", value: "nearest" },
  { label: "Most Active", value: "most_active" },
];

const CATEGORY_OPTIONS = [{ emoji: "🔎", label: "All" }, ...ITEM_CATEGORIES];
const SHEET_MAX_HEIGHT = Dimensions.get("window").height * 0.75;

/**
 * The body rendered inside the shared BottomSheet for Search's filter
 * sheet — every Phase 1/2 filter/sort, composed entirely from existing
 * common components (CategoryGrid, Input, DateField, Toggle, FilterChips)
 * rather than new visual design.
 *
 * @param {object} filters - Current filter state (see useSearchController.DEFAULT_FILTERS).
 * @param {(key: string, value: *) => void} onChange
 * @param {() => void} onReset
 * @param {() => void} onApply
 * @param {(() => Promise<{ok: boolean}>) | null} onSave - Null when logged out (saved searches require auth).
 */
export default function FilterSheetContent({ filters, onChange, onReset, onApply, onSave }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved

  const handleSave = async () => {
    if (!onSave || saveState === "saving") return;
    setSaveState("saving");
    const result = await onSave();
    setSaveState(result.ok ? "saved" : "idle");
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Filters</Text>
        <Text style={styles.resetLink} onPress={onReset}>
          Reset
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Type</Text>
        <FilterChips options={TYPE_OPTIONS} active={filters.type} onChange={(v) => onChange("type", v)} />

        <Text style={styles.sectionLabel}>Category</Text>
        <CategoryGrid
          categories={CATEGORY_OPTIONS}
          selected={filters.category || "All"}
          onSelect={(label) => onChange("category", label === "All" ? "" : label)}
        />

        <View style={styles.fieldRow}>
          <Input
            label="Brand"
            placeholder="e.g. Apple"
            value={filters.brand}
            onChangeText={(v) => onChange("brand", v)}
            style={styles.fieldHalf}
          />
          <Input
            label="Color"
            placeholder="e.g. Black"
            value={filters.color}
            onChangeText={(v) => onChange("color", v)}
            style={styles.fieldHalf}
          />
        </View>

        <View style={styles.fieldRow}>
          <Input
            label="City"
            placeholder="e.g. Lagos"
            value={filters.city}
            onChangeText={(v) => onChange("city", v)}
            style={styles.fieldHalf}
          />
          <Input
            label="State"
            placeholder="e.g. Lagos State"
            value={filters.state}
            onChangeText={(v) => onChange("state", v)}
            style={styles.fieldHalf}
          />
        </View>

        <Text style={styles.sectionLabel}>Date lost / found</Text>
        <View style={styles.fieldRow}>
          <DateField
            placeholder="From"
            value={filters.dateFrom}
            onChangeText={(v) => onChange("dateFrom", v)}
            style={styles.fieldHalf}
          />
          <DateField
            placeholder="To"
            value={filters.dateTo}
            onChangeText={(v) => onChange("dateTo", v)}
            style={styles.fieldHalf}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Reward available</Text>
          <Toggle on={filters.hasReward} onChange={(v) => onChange("hasReward", v)} accessibilityLabel="Reward available" />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Verified posters only</Text>
          <Toggle on={filters.verifiedOnly} onChange={(v) => onChange("verifiedOnly", v)} accessibilityLabel="Verified posters only" />
        </View>

        <Text style={styles.sectionLabel}>Sort by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          <FilterChips options={SORT_OPTIONS} active={filters.sort} onChange={(v) => onChange("sort", v)} variant="soft" />
        </ScrollView>
      </ScrollView>

      <View style={styles.footer}>
        {onSave ? (
          <Button variant="outline" onPress={handleSave} disabled={saveState === "saving"} style={styles.saveButton}>
            {saveState === "saved" ? "Saved!" : "Save this search"}
          </Button>
        ) : null}
        <Button onPress={onApply} style={styles.applyButton}>
          Show results
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    maxHeight: SHEET_MAX_HEIGHT,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  resetLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  scroll: {
    flexGrow: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textLight,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  sortRow: {
    gap: 8,
    paddingRight: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
  },
  saveButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});
