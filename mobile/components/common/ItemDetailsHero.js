import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../context/ThemeContext";
import Pill from "./Pill";
import ProgressDots from "./ProgressDots";
import ImageCarousel from "./ImageCarousel";
import NoImagePlaceholder from "./NoImagePlaceholder";
import HeroIconButton from "./HeroIconButton";
import ArrowLeftIcon from "./ArrowLeftIcon";
import HeartIcon from "./HeartIcon";
import Share2Icon from "./Share2Icon";
import MoreVerticalIcon from "./MoreVerticalIcon";

/**
 * Item Details' full-bleed image hero: the swipeable carousel, the back /
 * save / share / more actions overlaid on top, and the lost-or-found +
 * category pills and title anchored at the bottom.
 */
export default function ItemDetailsHero({
  item,
  height,
  activeImageIndex,
  onIndexChange,
  onImagePress,
  saved,
  onToggleSaved,
  onSharePress,
  onMenuPress,
  onBack,
  topInset,
  categoryEmoji,
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.hero, { height }]}>
      {item.images.length > 0 ? (
        <ImageCarousel
          images={item.images}
          height={height}
          activeIndex={activeImageIndex}
          onIndexChange={onIndexChange}
          onImagePress={onImagePress}
        />
      ) : (
        <NoImagePlaceholder height={height} />
      )}

      <LinearGradient
        colors={["rgba(15,23,42,0.75)", "rgba(15,23,42,0.1)", "transparent"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.actions, { paddingTop: topInset + 12 }]}>
        <HeroIconButton onPress={onBack} accessibilityLabel="Go back">
          <ArrowLeftIcon size={20} color="#fff" />
        </HeroIconButton>

        <View style={styles.actionsRight}>
          <HeroIconButton
            onPress={onToggleSaved}
            accessibilityLabel={saved ? "Remove from saved" : "Save item"}
          >
            <HeartIcon size={19} color={saved ? "#F87171" : "#fff"} fill={saved ? "#F87171" : "none"} />
          </HeroIconButton>
          <HeroIconButton onPress={onSharePress} accessibilityLabel="Share item">
            <Share2Icon size={19} color="#fff" />
          </HeroIconButton>
          <HeroIconButton onPress={onMenuPress} accessibilityLabel="More options">
            <MoreVerticalIcon size={19} color="#fff" />
          </HeroIconButton>
        </View>
      </View>

      <View style={styles.content} pointerEvents="none">
        <View style={styles.pillRow}>
          <Pill
            label={item.type === "lost" ? "LOST" : "FOUND"}
            variant={item.type === "lost" ? "red" : "green"}
            dot
          />
          {categoryEmoji ? <Pill label={`${categoryEmoji} ${item.category}`} variant="muted" /> : null}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        {item.images.length > 1 ? (
          <ProgressDots
            count={item.images.length}
            activeIndex={activeImageIndex}
            dotHeight={6}
            activeWidth={20}
            inactiveWidth={6}
            gap={6}
            inactiveColor="rgba(255,255,255,0.4)"
            style={styles.dots}
          />
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
  },
  actions: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  actionsRight: {
    flexDirection: "row",
    gap: 8,
  },
  content: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  dots: {
    marginTop: 12,
  },
});
