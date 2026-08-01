import React from "react";
import { View, StyleSheet } from "react-native";

export default function LoadingDots({
  count = 4,
  activeIndex = 1,
  dotColor = "rgba(255,255,255,0.9)",
  opacities = [0.35, 1, 0.55, 0.25],
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: index === activeIndex ? 28 : 8,
              backgroundColor: dotColor,
              opacity: opacities[index] ?? 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
});
