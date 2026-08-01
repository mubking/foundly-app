import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import ScanLineIcon from "./ScanLineIcon";
import CheckIcon from "./CheckIcon";

export default function AIScannerCard({ scanned, onScan, detectedTitle, detectedSubtitle, style }) {
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

        {!scanned ? (
          <Pressable style={styles.scanButton} onPress={onScan}>
            <Text style={styles.scanButtonText}>Scan</Text>
          </Pressable>
        ) : (
          <View style={styles.doneBadge}>
            <CheckIcon size={14} color={colors.success} strokeWidth={3} />
          </View>
        )}
      </View>

      {scanned ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>{detectedTitle}</Text>
          <Text style={styles.resultSubtitle}>{detectedSubtitle}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#fff",
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
});
