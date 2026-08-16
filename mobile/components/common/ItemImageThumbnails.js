import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import SafeImage from "./SafeImage";

/**
 * Tap-to-select thumbnail strip below Item Details' hero image — tapping one
 * moves the hero carousel to that image via `onSelect`. Renders nothing for
 * a single image: there's nothing to switch between, so an empty/single
 * placeholder thumbnail would only add noise.
 */
export default function ItemImageThumbnails({ images, activeIndex, onSelect, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (images.length <= 1) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, style]}>
      {images.map((image, index) => (
        <Pressable key={index} onPress={() => onSelect(index)}>
          <SafeImage source={image} style={[styles.thumb, index === activeIndex && styles.thumbActive]} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    gap: 10,
    paddingHorizontal: 20,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: {
    borderColor: colors.primary,
  },
});
