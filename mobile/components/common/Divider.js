import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function Divider({ label }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
  },
});
