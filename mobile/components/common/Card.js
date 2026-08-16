import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

export default function Card({ children, onPress, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} style={[styles.base, style]}>
      {children}
    </Wrapper>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
});
