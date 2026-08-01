import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function SectionTitle({ children, action, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{children}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
});
