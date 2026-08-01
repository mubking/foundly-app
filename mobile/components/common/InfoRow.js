import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";

export default function InfoRow({ icon, iconBg, title, titleColor, subtitle, subtitleColor, style }) {
  return (
    <View style={[styles.row, style]}>
      {iconBg ? <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>{icon}</View> : icon}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: subtitleColor || colors.textLight }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
});
