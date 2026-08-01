import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import EyeIcon from "../common/EyeIcon";
import EyeOffIcon from "../common/EyeOffIcon";

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  hint,
  error,
  style,
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ghost}
          secureTextEntry={secureTextEntry && !show}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
            {show ? <EyeOffIcon size={18} color={colors.subtle} /> : <EyeIcon size={18} color={colors.subtle} />}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  fieldMultiline: {
    minHeight: 88,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  fieldFocused: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  icon: {
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
  },
  hintText: {
    fontSize: 12,
    color: colors.textLight,
  },
});
