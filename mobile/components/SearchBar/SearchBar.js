import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import SearchIcon from "../common/SearchIcon";
import FilterIcon from "../common/FilterIcon";

export default function SearchBar({ placeholder = "Search…", onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.base, style]}>
      <SearchIcon size={18} color={colors.subtle} />
      <Text style={styles.placeholder}>{placeholder}</Text>
      <View style={styles.filterBadge}>
        <FilterIcon size={14} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: colors.ghost,
  },
  filterBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryTint,
  },
});
