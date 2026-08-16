import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import CheckIcon from "./CheckIcon";
import Card from "./Card";

const SIZES = {
  default: {
    marker: 24,
    dot: 8,
    checkSize: 12,
    lineFlex: true,
    lineHeight: 16,
    labelSize: 14,
    subSize: 12,
    rowGap: 16,
  },
  sm: {
    marker: 20,
    dot: 6,
    checkSize: 10,
    lineFlex: false,
    lineHeight: 24,
    labelSize: 12,
    subSize: 10,
    rowGap: 12,
  },
};

export default function StatusTimeline({ steps, title = "Status Timeline", size = "default", style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const s = SIZES[size];

  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.label}>{title}</Text>

      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <View key={index} style={styles.row}>
            <View style={styles.markerColumn}>
              <View
                style={[
                  styles.marker,
                  {
                    width: s.marker,
                    height: s.marker,
                    borderRadius: s.marker / 2,
                    backgroundColor: step.done ? colors.success : step.active ? colors.primaryTint : colors.surface,
                    borderWidth: step.active ? 2 : 0,
                    borderColor: colors.primary,
                  },
                ]}
              >
                {step.done ? (
                  <CheckIcon size={s.checkSize} color="#fff" strokeWidth={3} />
                ) : (
                  <View
                    style={[
                      styles.dot,
                      {
                        width: s.dot,
                        height: s.dot,
                        borderRadius: s.dot / 2,
                        backgroundColor: step.active ? colors.primary : colors.ghost,
                      },
                    ]}
                  />
                )}
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    s.lineFlex ? { flex: 1, minHeight: s.lineHeight } : { height: s.lineHeight },
                    { backgroundColor: step.done ? colors.greenTint : colors.surface },
                  ]}
                />
              ) : null}
            </View>

            <View style={[styles.textWrap, { paddingBottom: isLast ? 0 : s.rowGap }]}>
              <Text
                style={[
                  styles.stepLabel,
                  { fontSize: s.labelSize, color: step.done || step.active ? colors.text : colors.textLight },
                ]}
              >
                {step.label}
              </Text>
              <Text style={[styles.stepSub, { fontSize: s.subSize }]}>{step.sub}</Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  markerColumn: {
    alignItems: "center",
    paddingTop: 2,
  },
  marker: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {},
  line: {
    width: 2,
    marginTop: 4,
  },
  textWrap: {
    flex: 1,
  },
  stepLabel: {
    fontWeight: "600",
  },
  stepSub: {
    color: colors.subtle,
    marginTop: 2,
  },
});
