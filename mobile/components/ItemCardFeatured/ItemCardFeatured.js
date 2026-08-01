import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import colors from "../../constants/colors";
import Card from "../common/Card";
import Pill from "../common/Pill";
import MapPinIcon from "../common/MapPinIcon";
import CheckIcon from "../common/CheckIcon";

export default function ItemCardFeatured({ item, onPress }) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.image} />

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

const styles = StyleSheet.create({
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
