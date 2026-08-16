import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import Pill from "./Pill";
import MapPinIcon from "./MapPinIcon";
import ClockIcon from "./ClockIcon";
import SafeImage from "./SafeImage";

export default function ItemPreviewCard({ image, type, title, reward, location, time, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.imageWrap}>
        <SafeImage source={image} style={styles.image} iconSize={28} />
        <View style={styles.badgeRow}>
          <Pill label={type === "lost" ? "LOST" : "FOUND"} variant={type === "lost" ? "red" : "green"} />
          {reward ? <Pill label={`$${reward} reward`} variant="amber" /> : null}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPinIcon size={12} color={colors.subtle} />
            <Text style={styles.metaText}>{location}</Text>
          </View>
          <View style={styles.metaItem}>
            <ClockIcon size={12} color={colors.subtle} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  imageWrap: {
    height: 176,
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgeRow: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textLight,
  },
});
