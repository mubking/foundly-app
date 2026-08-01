import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import Card from "./Card";
import DollarSignIcon from "./DollarSignIcon";
import GiftIcon from "./GiftIcon";

export default function TransactionRow({ type, title, subtitle, amount, style }) {
  const isEarned = type === "earned";
  const isPositive = amount > 0;

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: isEarned ? colors.greenTint : colors.amberTint }]}>
          {isEarned ? (
            <DollarSignIcon size={18} color={colors.success} />
          ) : (
            <GiftIcon size={18} color={colors.secondary} />
          )}
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Text style={[styles.amount, { color: isPositive ? colors.success : colors.textLight }]}>
          {isPositive ? `+$${amount}` : `-$${Math.abs(amount)}`}
        </Text>
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
    gap: 12,
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
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
});
