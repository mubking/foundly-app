import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import SearchIcon from "./SearchIcon";
import TrendingUpIcon from "./TrendingUpIcon";
import ClockIcon from "./ClockIcon";

function Section({ title, children }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!children) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ icon, label, onPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {icon}
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * As-you-type dropdown shown under the search box: matching categories,
 * matching brands, the caller's own previous searches, and globally
 * popular searches — debounced upstream by useSearchSuggestions (Phase 3).
 * Tapping a category applies it as a filter; every other row fills the
 * search box with that text.
 */
export default function SearchSuggestionsList({ suggestions, onSelectCategory, onSelectQuery, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { categories, brands, previousSearches, popularSearches } = suggestions;

  const hasAny = categories.length || brands.length || previousSearches.length || popularSearches.length;
  if (!hasAny) return null;

  return (
    <View style={[styles.container, style]}>
      <Section title="Categories">
        {categories.length ? (
          <View style={styles.wrapRow}>
            {categories.map((category) => (
              <Row key={category} label={category} onPress={() => onSelectCategory(category)} />
            ))}
          </View>
        ) : null}
      </Section>

      <Section title="Brands">
        {brands.length ? (
          <View style={styles.wrapRow}>
            {brands.map((brand) => (
              <Row key={brand} label={brand} onPress={() => onSelectQuery(brand)} />
            ))}
          </View>
        ) : null}
      </Section>

      <Section title="Previous searches">
        {previousSearches.length
          ? previousSearches.map((query) => (
              <Row
                key={query}
                icon={<ClockIcon size={14} color={colors.subtle} />}
                label={query}
                onPress={() => onSelectQuery(query)}
              />
            ))
          : null}
      </Section>

      <Section title="Popular searches">
        {popularSearches.length
          ? popularSearches.map((query) => (
              <Row
                key={query}
                icon={<TrendingUpIcon size={14} color={colors.subtle} />}
                label={query}
                onPress={() => onSelectQuery(query)}
              />
            ))
          : null}
      </Section>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 4,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtle,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
});
