import React from "react";
import { View, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function ViewToggle({ options, active, onChange, style }) {
  return (
    <View style={[styles.row, style]}>
      {options.map(({ value, icon: Icon }) => {
        const isActive = active === value;
        return (
          <Pressable
            key={value}
            onPress={() => onChange(value)}
            style={[styles.item, isActive && styles.itemActive]}
          >
            <Icon size={15} color={isActive ? "#fff" : colors.textLight} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  item: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
});
