import React, { useMemo } from "react";
import { View, Image, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../context/ThemeContext";
import images from "../../constants/images";
import Avatar from "../Avatar/Avatar";
import SettingsIcon from "./SettingsIcon";
import Edit3Icon from "./Edit3Icon";

export default function ProfileHeader({ user, onSettingsPress, onEditAvatarPress }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <View style={styles.cover}>
        <LinearGradient
          colors={[colors.primaryDeep, colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image source={images.covers.profile} style={styles.coverImage} />

        <Pressable
          style={styles.settingsButton}
          onPress={onSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <SettingsIcon size={17} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.avatarWrap}>
        <Avatar size={80} initials={user.initials} source={user.avatar} ring />
        <Pressable
          style={styles.editBadge}
          onPress={onEditAvatarPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          <Edit3Icon size={12} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    position: "relative",
  },
  cover: {
    height: 176,
    overflow: "hidden",
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  settingsButton: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  avatarWrap: {
    position: "absolute",
    bottom: -48,
    left: 24,
  },
  editBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
