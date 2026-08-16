import React, { useMemo } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import images from "../../constants/images";
import MapPinIcon from "./MapPinIcon";

export default function LocationMapPreview({ label = "Pin Location", onPress, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // No pin-picking UI exists yet (no maps SDK integrated) — callers that
  // don't pass `onPress` get a plain, non-interactive preview instead of a
  // button that looks tappable but does nothing.
  const Wrapper = onPress ? Pressable : View;

  return (
    <View style={[styles.wrap, style]}>
      <Image source={images.misc.mapPlaceholder} style={styles.image} />

      <View style={styles.overlay}>
        <Wrapper style={styles.button} onPress={onPress}>
          <MapPinIcon size={16} color={colors.danger} />
          <Text style={styles.buttonText}>{label}</Text>
        </Wrapper>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    height: 176,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.55,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
