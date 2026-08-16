import React, { useMemo } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import images from "../../constants/images";
import Card from "./Card";
import MapPinIcon from "./MapPinIcon";

const PINS = [
  { top: "30%", left: "28%", type: "lost" },
  { top: "48%", left: "58%", type: "found" },
  { top: "62%", left: "22%", type: "found" },
  { top: "25%", left: "65%", type: "lost" },
  { top: "70%", left: "50%", type: "found" },
];

export default function SearchMapView({ lostCount, foundCount, onPinPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Image source={images.misc.mapPlaceholder} style={styles.image} />

      {PINS.map((pin, index) => (
        <Pressable
          key={index}
          onPress={onPinPress}
          style={[
            styles.pin,
            {
              top: pin.top,
              left: pin.left,
              backgroundColor: pin.type === "lost" ? colors.danger : colors.success,
            },
          ]}
        >
          <MapPinIcon size={16} color="#fff" />
        </Pressable>
      ))}

      <Card style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: colors.danger }]} />
        <Text style={styles.legendText}>{lostCount} Lost items</Text>
        <View style={[styles.dot, styles.dotSpaced, { backgroundColor: colors.success }]} />
        <Text style={styles.legendText}>{foundCount} Found items</Text>
      </Card>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    height: 520,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.5,
  },
  pin: {
    position: "absolute",
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  legend: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSpaced: {
    marginLeft: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    marginLeft: 8,
  },
});
