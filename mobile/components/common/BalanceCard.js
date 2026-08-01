import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import colors from "../../constants/colors";

export default function BalanceCard({ totalEarned, subtitle, breakdown, style }) {
  return (
    <LinearGradient
      colors={[colors.primaryDeep, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      <View style={styles.orb} />

      <Text style={styles.label}>Total Earned</Text>
      <Text style={styles.amount}>${totalEarned}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.breakdownRow}>
        {breakdown.map((item) => (
          <View key={item.label} style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>{item.label}</Text>
            <Text style={styles.breakdownValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: 200,
    height: 200,
    top: -50,
    right: -50,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  amount: {
    fontSize: 44,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1.5,
    marginVertical: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  breakdownItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
});
