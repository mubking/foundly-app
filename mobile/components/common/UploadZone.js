import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import CameraIcon from "./CameraIcon";
import ImageIcon from "./ImageIcon";
import Button from "../Button/Button";

export default function UploadZone({ onCamera, onGallery, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.zone, style]}>
      <View style={styles.iconBadge}>
        <CameraIcon size={24} color="#fff" />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>Add Photos</Text>
        <Text style={styles.subtitle}>Drag or tap • JPG, PNG up to 10MB</Text>
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="xs"
          icon={<CameraIcon size={12} color="#fff" />}
          onPress={onCamera}
        >
          Camera
        </Button>
        <Button
          variant="ghost"
          size="xs"
          icon={<ImageIcon size={12} color={colors.primary} />}
          onPress={onGallery}
        >
          Gallery
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  zone: {
    height: 180,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.primaryTint,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.primaryTintDark,
    overflow: "hidden",
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  textWrap: {
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    bottom: 16,
  },
});
