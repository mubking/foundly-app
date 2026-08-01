import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function FilterChips({ options, active, onChange, variant = "solid", equalWidth = false, style }) {
  const isSoft = variant === "soft";

  return (
    <View style={[styles.row, style]}>
      {options.map((option) => {
        const isActive = active === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              isSoft ? styles.softChip : styles.chip,
              isActive && (isSoft ? styles.softChipActive : styles.chipActive),
              equalWidth && styles.equalWidth,
            ]}
          >
            <Text
              style={[
                isSoft ? styles.softLabel : styles.label,
                isActive && (isSoft ? styles.softLabelActive : styles.labelActive),
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  equalWidth: {
    flex: 1,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textLight,
    textAlign: "center",
  },
  labelActive: {
    color: "#fff",
  },
  softChip: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "transparent",
  },
  softChipActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryTintDark,
  },
  softLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textLight,
    textAlign: "center",
  },
  softLabelActive: {
    color: colors.primary,
  },
});
