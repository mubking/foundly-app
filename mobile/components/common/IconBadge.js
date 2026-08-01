import React from "react";
import { View, StyleSheet } from "react-native";

export default function IconBadge({ size = 64, radius = 24, backgroundColor, children, style }) {
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: radius, backgroundColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
