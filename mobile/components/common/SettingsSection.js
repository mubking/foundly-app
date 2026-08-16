import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";

export default function SettingsSection({ title, children, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{title}</Text>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtle,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    overflow: "hidden",
  },
});
