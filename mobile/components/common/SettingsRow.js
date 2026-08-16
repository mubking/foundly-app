import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import ChevronRightIcon from "./ChevronRightIcon";

export default function SettingsRow({ icon, label, subtitle, right, danger = false, last = false, onPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.iconBadge, { backgroundColor: danger ? colors.redTint : colors.surface }]}>{icon}</View>

      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {right !== undefined ? right : <ChevronRightIcon size={16} color={colors.ghost} />}
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
  },
  subtitle: {
    fontSize: 12,
    color: colors.subtle,
    marginTop: 1,
  },
});
