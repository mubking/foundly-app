import React, { useMemo } from "react";
import { Pressable, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

export default function SocialButton({ variant = "light", icon, label, onPress, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isDark = variant === "dark";

  return (
    <Pressable onPress={onPress} style={[styles.base, isDark ? styles.dark : styles.light, style]}>
      {icon}
      <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  base: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  light: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  dark: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  labelDark: {
    color: "#fff",
  },
});
