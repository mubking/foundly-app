import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import colors from "../../constants/colors";

export default function StepProgress({ step, totalSteps, labels, style }) {
  const percent = (step / totalSteps) * 100;

  return (
    <View style={style}>
      <View style={styles.track}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLighter]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percent}%` }]}
        />
      </View>

      <View style={styles.labelsRow}>
        {labels.map((label, index) => (
          <Text key={label} style={[styles.label, index < step && styles.labelActive]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.ghost,
  },
  labelActive: {
    color: colors.primary,
  },
});
