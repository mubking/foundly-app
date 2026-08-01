import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import images from "../../constants/images";
import MapPinIcon from "./MapPinIcon";

export default function LocationMapPreview({ label = "Pin Location", onPress, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Image source={images.misc.mapPlaceholder} style={styles.image} />

      <View style={styles.overlay}>
        <Pressable style={styles.button} onPress={onPress}>
          <MapPinIcon size={16} color={colors.danger} />
          <Text style={styles.buttonText}>{label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
