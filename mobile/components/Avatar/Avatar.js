import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function Avatar({ size = 40, source, initials, ring = false, online = false }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: source ? "transparent" : colors.primary,
          },
          ring && styles.ring,
        ]}
      >
        {source ? (
          <Image source={source} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
        )}
      </View>

      {online ? (
        <View
          style={[
            styles.onlineDot,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ring: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
