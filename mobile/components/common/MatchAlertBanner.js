import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import ZapIcon from "./ZapIcon";
import ChevronRightIcon from "./ChevronRightIcon";

export default function MatchAlertBanner({ title, subtitle, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.base, style]}>
      <View style={styles.iconWrap}>
        <ZapIcon size={17} color="#fff" />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <ChevronRightIcon size={16} color="#D97706" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.amberTint,
    borderWidth: 1.5,
    borderColor: "rgba(245,158,11,0.3)",
  },
  iconWrap: {
    
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D97706",
  },
  subtitle: {
    fontSize: 12,
    color: "#D97706",
    opacity: 0.75,
    marginTop: 1,
  },
});
