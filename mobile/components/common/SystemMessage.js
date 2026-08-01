import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function SystemMessage({ text }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginVertical: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primaryTint,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
});
