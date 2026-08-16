import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import StatusState from "./StatusState";
import FilterChips from "./FilterChips";

const GROUPS = [
  { key: "similarCategories", title: "Similar categories" },
  { key: "nearbyLocations", title: "Nearby locations" },
  { key: "similarColors", title: "Similar colors" },
  { key: "similarBrands", title: "Similar brands" },
];

/**
 * Phase 5: "No exact matches." plus tap-to-retry recommendations built from
 * the search endpoint's `recommendations` payload (only present when a
 * search returns zero results — see search.service.js's
 * getEmptyStateSuggestions). Each chip swaps a single filter and re-runs
 * the search via the matching `onSelect*` callback.
 */
export default function SearchEmptyState({ recommendations, onSelectCategory, onSelectCity, onSelectColor, onSelectBrand }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handlers = {
    similarCategories: onSelectCategory,
    nearbyLocations: onSelectCity,
    similarColors: onSelectColor,
    similarBrands: onSelectBrand,
  };

  const visibleGroups = GROUPS.filter((group) => recommendations?.[group.key]?.length);

  return (
    <StatusState message="No exact matches." tone="neutral" style={styles.state}>
      {visibleGroups.length ? (
        <View style={styles.groups}>
          {visibleGroups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <FilterChips
                options={recommendations[group.key].map((value) => ({ label: value, value }))}
                active={null}
                onChange={handlers[group.key]}
                variant="soft"
                style={styles.chipsWrap}
              />
            </View>
          ))}
        </View>
      ) : null}
    </StatusState>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  state: {
    paddingTop: 40,
  },
  groups: {
    width: "100%",
    gap: 16,
    marginTop: 8,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textLight,
    textAlign: "center",
  },
  chipsWrap: {
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
