import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "../../context/ThemeContext";

export default function Avatar({ size = 40, source, initials, ring = false, online = false }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [failed, setFailed] = useState(false);
  const showImage = source && !failed;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
          },
          ring && styles.ring,
        ]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>

        {showImage ? (
          <Image
            source={source}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            transition={150}
            cachePolicy="memory-disk"
            onError={() => setFailed(true)}
          />
        ) : null}
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

const makeStyles = (colors) => StyleSheet.create({
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
