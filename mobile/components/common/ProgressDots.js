import React from "react";
import { View, StyleSheet } from "react-native";

export default function ProgressDots({
  count,
  activeIndex,
  dotHeight = 4,
  activeWidth = 32,
  inactiveWidth = 8,
  gap = 8,
  activeColor = "#fff",
  inactiveColor = "rgba(255,255,255,0.25)",
  style,
}) {
  return (
    <View style={[styles.row, { gap }, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              height: dotHeight,
              width: index === activeIndex ? activeWidth : inactiveWidth,
              backgroundColor: index === activeIndex ? activeColor : inactiveColor,
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
  },
  dot: {
    borderRadius: 999,
  },
});
