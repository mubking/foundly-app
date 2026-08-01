import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

import colors from "../../constants/colors";
import Card from "./Card";

const RADIUS = 28;
const STROKE_WIDTH = 6;
const SIZE = 68;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TrustScoreCard({ score, maxScore = 5, percent, stats, style }) {
  const dash = percent * CIRCUMFERENCE;

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Trust Score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.maxScore}>/{maxScore.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE} style={styles.ringSvg}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.surface} strokeWidth={STROKE_WIDTH} fill="none" />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.ringLabelWrap}>
            <Text style={styles.ringLabel}>{Math.round(percent * 100)}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  score: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -1,
  },
  maxScore: {
    fontSize: 14,
    color: colors.textLight,
  },
  ringWrap: {
    marginLeft: "auto",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSvg: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
  },
  ringLabelWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
    textAlign: "center",
  },
});
