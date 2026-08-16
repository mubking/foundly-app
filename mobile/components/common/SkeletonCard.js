import React, { useEffect, useMemo, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";

/**
 * Shimmer placeholder shown while a search request is in flight, matching
 * ItemCardRow's/ItemCardGrid's real dimensions so the loading state doesn't
 * visibly reflow into results — same pulse-opacity animation as
 * TypingIndicator's dots, applied to whole blocks instead.
 */
export default function SkeletonCard({ variant = "row", style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  if (variant === "grid") {
    return (
      <Card style={[styles.gridCard, style]}>
        <Animated.View style={[styles.gridImage, { opacity }]} />
        <View style={styles.gridContent}>
          <Animated.View style={[styles.line, styles.lineWide, { opacity }]} />
          <Animated.View style={[styles.line, styles.lineNarrow, { opacity }]} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.rowCard, style]}>
      <Animated.View style={[styles.rowImage, { opacity }]} />
      <View style={styles.rowContent}>
        <Animated.View style={[styles.line, styles.lineTag, { opacity }]} />
        <Animated.View style={[styles.line, styles.lineWide, { opacity }]} />
        <Animated.View style={[styles.line, styles.lineNarrow, { opacity }]} />
      </View>
    </Card>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  rowCard: {
    flexDirection: "row",
    overflow: "hidden",
  },
  rowImage: {
    width: 88,
    height: 88,
    backgroundColor: colors.surfaceAlt,
  },
  rowContent: {
    flex: 1,
    padding: 12,
    gap: 8,
    justifyContent: "center",
  },
  gridCard: {
    flex: 1,
    overflow: "hidden",
  },
  gridImage: {
    height: 128,
    backgroundColor: colors.surfaceAlt,
  },
  gridContent: {
    padding: 12,
    gap: 8,
  },
  line: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceAlt,
  },
  lineTag: {
    width: 48,
    height: 14,
    borderRadius: 7,
  },
  lineWide: {
    width: "80%",
  },
  lineNarrow: {
    width: "50%",
  },
});
