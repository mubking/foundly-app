import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import Card from "../common/Card";
import Pill from "../common/Pill";
import MapPinIcon from "../common/MapPinIcon";
import ChevronRightIcon from "../common/ChevronRightIcon";

export default function ItemCardRow({ item, onPress }) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <Image source={item.image} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} />
          {item.reward ? <Pill label={`$${item.reward} reward`} variant="amber" /> : null}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.locationRow}>
            <MapPinIcon size={11} color={colors.subtle} />
            <Text style={styles.location}>{item.location}</Text>
          </View>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>

      <View style={styles.chevron}>
        <ChevronRightIcon size={16} color={colors.ghost} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
  },
  image: {
    width: 88,
    height: 88,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: -0.1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 11,
    color: colors.textLight,
  },
  time: {
    fontSize: 11,
    color: colors.subtle,
  },
  chevron: {
    justifyContent: "center",
    paddingRight: 12,
  },
});
