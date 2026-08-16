import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import ImageIcon from "./ImageIcon";

/**
 * Neutral "no image available" state for an item that genuinely has zero
 * uploaded photos — used instead of a stock/sample photo (a world-map
 * graphic was previously standing in here, which read as fake listing
 * data). Deliberately not the same component as SafeImage's inline error
 * fallback: this one is a full-size block (used for Item Details' hero,
 * where there's no image to even attempt loading), not a small icon next
 * to a failed thumbnail.
 */
export default function NoImagePlaceholder({ height, style, iconSize = 32 }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, height ? { height } : null, style]}>
      <ImageIcon size={iconSize} color={colors.subtle} />
      <Text style={styles.label}>No image available</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.subtle,
  },
});
