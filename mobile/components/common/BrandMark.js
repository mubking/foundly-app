import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

export default function BrandMark({ style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.row, style]}>
      <Image
        source={require("../../assets/splash-icon.png")}
        style={styles.mark}
        resizeMode="contain"
        accessibilityLabel="Reunio logo"
      />
      <Text style={styles.text}>Reunio</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mark: {
    width: 44,
    height: 44,
  },
  text: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.4,
  },
});
