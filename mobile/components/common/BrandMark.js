import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import TargetIcon from "./TargetIcon";

export default function BrandMark({ style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.badge}>
        <TargetIcon size={17} color="#fff" strokeWidth={1.8} />
      </View>
      <Text style={styles.text}>Foundly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.4,
  },
});
