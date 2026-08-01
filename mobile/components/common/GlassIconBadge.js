import React from "react";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function GlassIconBadge({
  size = 88,
  radius = 24,
  intensity = 30,
  backgroundColor = "rgba(255,255,255,0.14)",
  borderColor = "rgba(255,255,255,0.25)",
  children,
}) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <BlurView
        intensity={intensity}
        tint="light"
        style={[
          StyleSheet.absoluteFill,
          styles.backing,
          { borderRadius: radius, backgroundColor, borderColor },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  backing: {
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  content: {
    zIndex: 1,
  },
});
