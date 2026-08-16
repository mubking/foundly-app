import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../context/ThemeContext";
import Card from "../common/Card";
import Pill from "../common/Pill";
import MapPinIcon from "../common/MapPinIcon";
import CheckIcon from "../common/CheckIcon";
import SafeImage from "../common/SafeImage";

function ItemCardFeatured({ item, onPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Built here, not with an inline arrow at the call site — keeps this
  // prop's identity stable across a parent re-render that doesn't touch
  // `item`, so React.memo below actually skips re-rendering this card.
  const handlePress = useCallback(() => onPress(item), [onPress, item]);

  return (
    <Card onPress={handlePress} style={styles.card}>
      <View style={styles.imageWrap}>
        <SafeImage source={item.image} style={styles.image} iconSize={28} />

        <LinearGradient
          colors={["transparent", "rgba(15,23,42,0.55)"]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.topRow}>
          <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} />
          {item.reward ? <Pill label={`$${item.reward}`} variant="amber" /> : null}
        </View>

        {item.verified ? (
          <View style={styles.verifiedBadge}>
            <CheckIcon size={12} color="#fff" strokeWidth={3} />
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <MapPinIcon size={11} color={colors.subtle} />
          <Text style={styles.location}>{item.neighborhood}</Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </Card>
  );
}

export default React.memo(ItemCardFeatured);

const makeStyles = (colors) => StyleSheet.create({
  card: {
    width: 200,
    overflow: "hidden",
  },
  imageWrap: {
    height: 144,
    backgroundColor: colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  topRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  location: {
    fontSize: 11,
    color: colors.textLight,
  },
  time: {
    fontSize: 11,
    color: colors.subtle,
    marginTop: 4,
  },
});
