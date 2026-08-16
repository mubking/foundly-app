import React, { useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import ScanLineIcon from "./ScanLineIcon";
import CheckIcon from "./CheckIcon";

/**
 * "Scan" button for AI-drafting a report's title/category/description from
 * its first photo — `status`/`error` come straight from hooks/useAiScan.js,
 * and `detectedTitle`/`detectedSubtitle` should reflect the form's own
 * (now AI-filled) title/category, not a separate copy of the result.
 */
export default function AIScannerCard({ status, error, onScan, detectedTitle, detectedSubtitle, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scanning = status === "scanning";
  const done = status === "done";

  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <ScanLineIcon size={17} color={colors.purple} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title}>AI Auto-Recognition</Text>
          <Text style={styles.subtitle}>Point at item — AI fills everything in</Text>
        </View>

        {scanning ? (
          <ActivityIndicator color={colors.purple} />
        ) : done ? (
          <View style={styles.doneBadge}>
            <CheckIcon size={14} color={colors.success} strokeWidth={3} />
          </View>
        ) : (
          <Pressable style={styles.scanButton} onPress={onScan}>
            <Text style={styles.scanButtonText}>Scan</Text>
          </Pressable>
        )}
      </View>

      {done ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            Detected: {detectedTitle}
          </Text>
          <Text style={styles.resultSubtitle}>{detectedSubtitle}</Text>
        </View>
      ) : status === "error" ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.15)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.purpleTint,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.purple,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  scanButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.purple,
  },
  scanButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenTint,
  },
  result: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  resultSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    marginTop: 8,
  },
});
