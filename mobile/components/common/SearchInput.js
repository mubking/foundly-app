import React, { useMemo } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import SearchIcon from "./SearchIcon";
import XIcon from "./XIcon";

export default function SearchInput({
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
  onFocus,
  onBlur,
  style,
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.base, style]}>
      <SearchIcon size={17} color={colors.primary} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ghost}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
        style={styles.input}
      />

      {value ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <XIcon size={16} color={colors.subtle} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  base: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
});
