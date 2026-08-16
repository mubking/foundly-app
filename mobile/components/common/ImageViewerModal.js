import React from "react";
import { Modal, View, Dimensions, StyleSheet } from "react-native";

import ImageCarousel from "./ImageCarousel";
import ProgressDots from "./ProgressDots";
import HeroIconButton from "./HeroIconButton";
import XIcon from "./XIcon";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Full-screen swipeable viewer for an item's images, opened by tapping the
 * hero image on Item Details. Reuses {@link ImageCarousel} (with
 * `contentFit="contain"` so nothing is cropped, unlike the hero's `"cover"`)
 * instead of a second, separate swipe implementation.
 */
export default function ImageViewerModal({ visible, images, activeIndex, onIndexChange, onClose, topInset = 0 }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <ImageCarousel
          images={images}
          height={SCREEN_HEIGHT}
          activeIndex={activeIndex}
          onIndexChange={onIndexChange}
          contentFit="contain"
        />

        <HeroIconButton
          onPress={onClose}
          style={[styles.closeButton, { top: topInset + 12 }]}
          accessibilityLabel="Close"
        >
          <XIcon size={20} color="#fff" />
        </HeroIconButton>

        {images.length > 1 ? (
          <ProgressDots count={images.length} activeIndex={activeIndex} style={styles.dots} />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    position: "absolute",
    right: 20,
  },
  dots: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
});
