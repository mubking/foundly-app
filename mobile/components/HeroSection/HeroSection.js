import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import colors from "../../constants/colors";
import TrendingUpIcon from "../common/TrendingUpIcon";
import AlertCircleIcon from "../common/AlertCircleIcon";
import UploadIcon from "../common/UploadIcon";
import GlassButton from "../common/GlassButton";

export default function HeroSection({ itemsReturned, trend, onReportLost, onUploadFound, style }) {
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
            <Text style={styles.label}>Community Impact</Text>
            <Text style={styles.value}>{itemsReturned.toLocaleString()}</Text>
            <Text style={styles.caption}>items returned this month</Text>
          </View>
          <View style={styles.trendPill}>
            <TrendingUpIcon size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.trendText}>{trend}</Text>
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

const styles = StyleSheet.create({
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
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
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
