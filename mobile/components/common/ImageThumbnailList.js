import React, { useMemo } from "react";
import { View, Pressable, ScrollView, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import XIcon from "./XIcon";
import SafeImage from "./SafeImage";

/**
 * Horizontal strip of picked-photo thumbnails with a remove button on each,
 * shown beneath the camera/gallery picker on the Upload Found Item / Report
 * Lost Item screens, and on Edit Lost/Found Item (where some thumbnails are
 * already-hosted URLs from useEditableImages.js, not just freshly-picked
 * local files — so these can genuinely 404, unlike a same-session local
 * picker URI). Renders nothing when there are no images yet.
 */
export default function ImageThumbnailList({ images, onRemove, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (!images.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, style]}>
      {images.map((image, index) => (
        <View key={image.uri} style={styles.thumbWrap}>
          <SafeImage source={{ uri: image.uri }} style={styles.thumb} iconSize={20} />
          <Pressable
            style={styles.removeButton}
            onPress={() => onRemove(index)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <XIcon size={12} color="#fff" strokeWidth={3} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    gap: 10,
  },
  thumbWrap: {
    width: 72,
    height: 72,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
