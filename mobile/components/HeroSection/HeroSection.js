import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../context/ThemeContext";
import AlertCircleIcon from "../common/AlertCircleIcon";
import UploadIcon from "../common/UploadIcon";
import GlassButton from "../common/GlassButton";

/**
 * `totalItems` is the live count of lost + found reports in the system
 * (from the items search endpoint's `total`, captured in HomeScreen) — not
 * "items returned"/a trend percentage, since the backend has no concept of
 * a completed return and no historical trend data to report honestly.
 */
export default function HeroSection({ totalItems, onReportLost, onUploadFound, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={style}>
      <LinearGradient
        colors={[colors.primaryDeep, colors.primary, colors.primaryLighter]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={[styles.orb, styles.orbTop]} />
        <View style={[styles.orb, styles.orbBottom]} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.label}>Community Activity</Text>
            <Text style={styles.value}>{totalItems.toLocaleString()}</Text>
            <Text style={styles.caption}>items reported so far</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <GlassButton
            style={styles.reportButton}
            icon={<AlertCircleIcon size={16} color="#fff" />}
            onPress={onReportLost}
          >
            Report Lost
          </GlassButton>

          <Pressable style={styles.uploadButton} onPress={onUploadFound}>
            <UploadIcon size={16} color={colors.primary} />
            <Text style={styles.uploadText}>Upload Found</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  orbTop: {
    width: 200,
    height: 200,
    top: -60,
    right: -40,
  },
  orbBottom: {
    width: 120,
    height: 120,
    bottom: -30,
    right: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 34,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  caption: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  reportButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  uploadButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
});
