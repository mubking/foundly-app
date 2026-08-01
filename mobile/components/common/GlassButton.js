import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function GlassButton({ children, icon, onPress, style, textStyle, intensity = 20 }) {
  return (
    <Pressable onPress={onPress} style={[styles.base, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.row}>
        {icon}
        <Text style={[styles.text, textStyle]}>{children}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
});
