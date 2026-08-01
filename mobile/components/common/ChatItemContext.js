import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import ChevronRightIcon from "./ChevronRightIcon";

export default function ChatItemContext({ image, title, subtitle, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.wrap, style]}>
      <Image source={image} style={styles.thumb} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRightIcon size={15} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryTintDark,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
});
