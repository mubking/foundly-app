import React from "react";
import { View, Text, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import Card from "./Card";
import Input from "../Input/Input";

export default function NumberedQuestionCard({ number, question, value, onChangeText, hint, style }) {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{number}</Text>
        </View>
        <Text style={styles.question}>{question}</Text>
      </View>

      <Input placeholder="Your answer…" value={value} onChangeText={onChangeText} hint={hint} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryTint,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
});
