import React, { useMemo, useRef, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "../../context/ThemeContext";
import ImageIcon from "./ImageIcon";
import { logImageEvent } from "../../utils/imageLogger";

/**
 * Wraps expo-image with the same "swap to a neutral icon box on error"
 * fallback ClaimCard already used for its proof photo — centralized here so
 * every content image (not avatars, which fall back to initials via
 * Avatar.js) degrades the same way instead of leaving a blank/broken box
 * behind a bad URL or a missing image. Shows a small spinner while the
 * image is in flight, same treatment as ImageCarousel.
 *
 * Accepts both `{ uri }` sources and raw URL strings because backend chat
 * payloads expose item images as strings while navigation params may already
 * be normalized to `{ uri }`. Normalizing here keeps every SafeImage caller
 * consistent and prevents valid Cloudinary URLs from falling through to the
 * placeholder.
 */
export default function SafeImage({ source, style, iconSize = 20, ...imageProps }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const startedAtRef = useRef(0);
  const normalizedSource = typeof source === "string" && source ? { uri: source } : source;
  const uri = typeof normalizedSource === "object" && normalizedSource ? normalizedSource.uri : undefined;

  if (failed || !normalizedSource) {
    return (
      <View style={[style, styles.fallback]}>
        <ImageIcon size={iconSize} color={colors.subtle} />
      </View>
    );
  }

  return (
    <View style={[style, styles.wrap]}>
      <Image
        source={normalizedSource}
        style={StyleSheet.absoluteFill}
        transition={150}
        cachePolicy="memory-disk"
        onLoadStart={() => {
          startedAtRef.current = Date.now();
          logImageEvent("loading", uri);
        }}
        onLoad={() => {
          setLoading(false);
          logImageEvent("loaded", uri, { durationMs: Date.now() - startedAtRef.current });
        }}
        onError={(event) => {
          setFailed(true);
          logImageEvent("failed", uri, { error: event?.error });
        }}
        {...imageProps}
      />
      {loading ? (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.subtle} />
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  wrap: {
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  loadingOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
});
