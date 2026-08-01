import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import colors from "../../constants/colors";
import HomeIcon from "../common/HomeIcon";
import SearchIcon from "../common/SearchIcon";
import BellIcon from "../common/BellIcon";
import MessageCircleIcon from "../common/MessageCircleIcon";
import UserIcon from "../common/UserIcon";

const NAV_ITEMS = [
  { id: "Home", icon: HomeIcon, label: "Home" },
  { id: "Search", icon: SearchIcon, label: "Search" },
  { id: "Notifications", icon: BellIcon, label: "Alerts" },
  { id: "Chat", icon: MessageCircleIcon, label: "Messages" },
  { id: "Profile", icon: UserIcon, label: "Profile" },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <View style={styles.bar}>
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <Pressable key={id} onPress={() => onNavigate(id)} style={styles.item}>
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon size={20} color={isActive ? colors.primary : colors.subtle} strokeWidth={isActive ? 2.5 : 1.8} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    minWidth: 52,
    alignItems: "center",
    gap: 4,
  },
  iconWrap: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.primaryTint,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.subtle,
  },
  labelActive: {
    color: colors.primary,
  },
});
