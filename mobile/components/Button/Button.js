import React, { useMemo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

// Depends on the active palette, so it's a factory called from inside the
// component (see `variants` below) rather than a module-level constant.
const getVariants = (colors) => ({
  primary: { bg: colors.primary, text: "#fff", border: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.32 },
  outline: { bg: "transparent", text: colors.primary, border: colors.primary, shadowOpacity: 0 },
  ghost: { bg: colors.primaryTint, text: colors.primary, border: "transparent", shadowOpacity: 0 },
  surface: { bg: colors.surface, text: colors.ink2, border: "transparent", shadowOpacity: 0 },
  green: { bg: colors.success, text: "#fff", border: colors.success, shadowColor: colors.success, shadowOpacity: 0.32 },
  red: { bg: colors.danger, text: "#fff", border: colors.danger, shadowColor: colors.danger, shadowOpacity: 0.28 },
  amber: { bg: colors.secondary, text: "#fff", border: colors.secondary, shadowColor: colors.secondary, shadowOpacity: 0.28 },
});

const SIZES = {
  xs: { height: 32, paddingHorizontal: 12, fontSize: 12 },
  sm: { height: 40, paddingHorizontal: 16, fontSize: 13 },
  md: { height: 48, paddingHorizontal: 22, fontSize: 15 },
  lg: { height: 56, paddingHorizontal: 28, fontSize: 16 },
};

export default function Button({
  children,
  onPress,
  icon,
  iconRight,
  variant = "primary",
  size = "lg",
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
}) {
  const colors = useTheme();
  const variants = useMemo(() => getVariants(colors), [colors]);
  const v = variants[variant];
  const s = SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: v.bg,
          borderColor: v.border,
          shadowColor: v.shadowColor,
          shadowOpacity: v.shadowOpacity,
          elevation: v.shadowOpacity ? 6 : 0,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }, textStyle]}>{children}</Text>
      {iconRight}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
