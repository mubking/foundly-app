import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

export default function AchievementsRow({ achievements, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, style]}>
      {achievements.map((badge) => (
        <View key={badge.label} style={styles.item}>
          <View style={[styles.badge, { backgroundColor: `${badge.color}14`, borderColor: `${badge.color}25` }]}>
            <Text style={styles.emoji}>{badge.emoji}</Text>
          </View>
          <Text style={styles.label}>{badge.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 8,
  },
  item: {
    alignItems: "center",
    gap: 6,
    width: 64,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.textLight,
    textAlign: "center",
  },
});
