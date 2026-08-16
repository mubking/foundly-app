import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../context/ThemeContext";

export default function PhotoSourceButton({ icon, label, variant = "gradient", onPress, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isGradient = variant === "gradient";
  const Container = isGradient ? LinearGradient : View;
  const containerProps = isGradient
    ? { colors: [colors.primaryDeep, colors.primary], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : {};

  return (
    <Pressable onPress={onPress} style={[styles.pressable, style]}>
      <Container {...containerProps} style={[styles.base, isGradient ? styles.gradient : styles.dashed]}>
        <View style={[styles.iconBadge, isGradient ? styles.iconBadgeLight : styles.iconBadgeMuted]}>{icon}</View>
        <Text style={[styles.label, isGradient ? styles.labelLight : styles.labelMuted]}>{label}</Text>
      </Container>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  pressable: {
    flex: 1,
  },
  base: {
    height: 160,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  gradient: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
  dashed: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.surfaceAlt,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeLight: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  iconBadgeMuted: {
    backgroundColor: colors.surfaceAlt,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  labelLight: {
    color: "#fff",
  },
  labelMuted: {
    color: colors.textLight,
  },
});
