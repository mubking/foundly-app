import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import Card from "./Card";
import Pill from "./Pill";
import MapPinIcon from "./MapPinIcon";
import ChevronRightIcon from "./ChevronRightIcon";

export default function StatusItemRow({
  image,
  title,
  statusLabel,
  statusVariant,
  reward,
  location,
  timeLabel,
  onPress,
}) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <Image source={image} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Pill label={statusLabel} variant={statusVariant} dot />
          {reward ? <Pill label={`$${reward} reward`} variant="amber" /> : null}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.locationRow}>
            <MapPinIcon size={11} color={colors.subtle} />
            <Text style={styles.location}>{location}</Text>
          </View>
          <Text style={styles.time}>{timeLabel}</Text>
        </View>
      </View>

      <View style={styles.chevron}>
        <ChevronRightIcon size={15} color={colors.ghost} />
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
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textLight,
  },
  time: {
    fontSize: 12,
    color: colors.subtle,
  },
  chevron: {
    justifyContent: "center",
    paddingRight: 12,
  },
});
