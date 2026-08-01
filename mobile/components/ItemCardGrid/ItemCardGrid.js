import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import Card from "../common/Card";
import Pill from "../common/Pill";
import MapPinIcon from "../common/MapPinIcon";

export default function ItemCardGrid({ item, onPress, style }) {
  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.image} />
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

const styles = StyleSheet.create({
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
