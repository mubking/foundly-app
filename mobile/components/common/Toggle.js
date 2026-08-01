import React, { useEffect, useRef } from "react";
import { Pressable, Animated, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function Toggle({ on, onChange }) {
  const translate = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(translate, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [on, translate]);

  const translateX = translate.interpolate({ inputRange: [0, 1], outputRange: [0, 21] });

  return (
    <Pressable onPress={() => onChange(!on)} style={[styles.track, on && styles.trackOn]}>
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 51,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  trackOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryHover,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
});
