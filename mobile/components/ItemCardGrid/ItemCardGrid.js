import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import Card from "../common/Card";
import Pill from "../common/Pill";
import MapPinIcon from "../common/MapPinIcon";
import SafeImage from "../common/SafeImage";

function ItemCardGrid({ item, onPress, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Built here, not with an inline arrow at the call site — keeps this
  // prop's identity stable across a parent re-render that doesn't touch
  // `item`, so React.memo below actually skips re-rendering this card.
  const handlePress = useCallback(() => onPress(item), [onPress, item]);

  return (
    <Card onPress={handlePress} style={[styles.card, style]}>
      <View style={styles.imageWrap}>
        <SafeImage source={item.image} style={styles.image} />
        <View style={styles.badgeWrap}>
          <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <MapPinIcon size={10} color={colors.subtle} />
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        {item.reward ? <Pill label={`$${item.reward}`} variant="amber" style={styles.rewardPill} /> : null}
      </View>
    </Card>
  );
}

export default React.memo(ItemCardGrid);

const makeStyles = (colors) => StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  imageWrap: {
    height: 128,
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgeWrap: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  content: {
    padding: 12,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 10,
    color: colors.textLight,
  },
  rewardPill: {
    marginTop: 2,
  },
});
