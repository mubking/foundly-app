import React, { useEffect, useRef, useState, useMemo } from "react";
import { ScrollView, View, Pressable, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "../../context/ThemeContext";
import ImageIcon from "./ImageIcon";
import { logImageEvent } from "../../utils/imageLogger";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Horizontal, paginated image carousel filling its parent. Reports the
 * active page index via `onIndexChange`, and can also be driven externally
 * via `activeIndex` (e.g. a thumbnail tap) — `lastIndexRef` keeps the two
 * in sync so a programmatic scroll doesn't re-fire `onIndexChange`, and a
 * user swipe doesn't trigger a redundant `scrollTo`.
 *
 * The index is only ever committed on `onMomentumScrollEnd` — i.e. once
 * `pagingEnabled`'s own snap animation has fully settled — not on `onScroll`.
 * `onScroll` fires continuously throughout the drag *and* the subsequent
 * native settle animation, well before the gesture is actually done; wiring
 * `onIndexChange` to it means a mid-gesture index gets round-tripped back in
 * as the controlled `activeIndex` prop while the ScrollView is still moving,
 * so the effect below's `scrollTo` can fire against a position the view
 * hasn't reached (or has since moved past) — which reads as the swipe being
 * fought/snapped back. Committing only after momentum ends means that round
 * trip can never start until the gesture is already finished.
 *
 * Every image loads through `expo-image`: a per-image spinner while it
 * loads, and a neutral "broken image" icon in place of the photo if it
 * fails to load — never a stock/sample photo standing in for a real one.
 * All pages are mounted up front (not swapped per active index), so switching
 * between already-loaded images via swipe or thumbnail never re-triggers a
 * load or flickers — this is the one place that logic lives, shared by
 * both the details hero and the full-screen viewer instead of duplicating it.
 */
export default function ImageCarousel({
  images: sources,
  height,
  activeIndex = 0,
  onIndexChange,
  onImagePress,
  contentFit = "cover",
  style,
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollRef = useRef(null);
  const lastIndexRef = useRef(activeIndex);
  const [loadingIndices, setLoadingIndices] = useState(() => new Set(sources.map((_, i) => i)));
  const [failedIndices, setFailedIndices] = useState(() => new Set());

  // Resets per-image load state when the caller hands us a genuinely new
  // set of images (e.g. `reload()` on the details screen) — not on every
  // render, since `sources` is otherwise stable.
  useEffect(() => {
    setLoadingIndices(new Set(sources.map((_, i) => i)));
    setFailedIndices(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources]);

  useEffect(() => {
    if (activeIndex === lastIndexRef.current) return;
    lastIndexRef.current = activeIndex;
    scrollRef.current?.scrollTo({ x: activeIndex * SCREEN_WIDTH, animated: true });
  }, [activeIndex]);

  const handleMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index === lastIndexRef.current) return;
    lastIndexRef.current = index;
    onIndexChange?.(index);
  };

  const markLoaded = (index) => {
    setLoadingIndices((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      style={[StyleSheet.absoluteFill, style]}
    >
      {sources.map((source, index) => {
        const uri = typeof source === "object" && source ? source.uri : undefined;
        return (
          <Pressable key={index} style={{ width: SCREEN_WIDTH, height }} onPress={() => onImagePress?.(index)}>
            {failedIndices.has(index) ? (
              <View style={[styles.image, styles.failedFallback]}>
                <ImageIcon size={28} color={colors.subtle} />
              </View>
            ) : (
              <Image
                source={source}
                style={styles.image}
                contentFit={contentFit}
                transition={150}
                cachePolicy="memory-disk"
                onLoadStart={() => logImageEvent("loading", uri)}
                onLoad={() => {
                  markLoaded(index);
                  logImageEvent("loaded", uri);
                }}
                onError={(event) => {
                  markLoaded(index);
                  setFailedIndices((prev) => new Set(prev).add(index));
                  logImageEvent("failed", uri, { error: event?.error });
                }}
              />
            )}
            {loadingIndices.has(index) ? (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surface,
  },
  failedFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
