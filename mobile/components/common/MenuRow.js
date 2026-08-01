import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import Card from "./Card";
import ChevronRightIcon from "./ChevronRightIcon";

export default function MenuRow({
  icon,
  iconColor,
  label,
  subtitle,
  badge,
  labelColor,
  showChevron = true,
  onPress,
  style,
}) {
  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: `${iconColor}15` }]}>{icon}</View>

        <View style={styles.textWrap}>
          <Text style={[styles.label, labelColor && { color: labelColor }]}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {badge ? (
          <View style={[styles.badge, { backgroundColor: iconColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}

        {showChevron ? <ChevronRightIcon size={16} color={colors.ghost} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.subtle,
    marginTop: 1,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
});
