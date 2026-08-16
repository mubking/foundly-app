import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function HeroIconButton({ children, onPress, style, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
