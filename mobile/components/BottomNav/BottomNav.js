import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { useUnreadConversationsCount } from "../../hooks/useUnreadConversationsCount";
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
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Android is edge-to-edge (`edgeToEdgeEnabled: true`), so the app draws
  // behind the system navigation/gesture area. The screen containers only
  // apply the *top* inset (they render this bar themselves rather than a
  // bottom tab navigator), so this bar — not its parent — must account for
  // the bottom inset, or its icons/labels land underneath the system nav
  // bar. `insets.bottom` is the real per-device inset (gesture pill or
  // 3-button nav), layered on top of the design's own 16px bar padding, so
  // devices without a bottom inset render exactly as designed.
  const insets = useSafeAreaInsets();
  // Count of conversations with unread messages, not total unread messages
  // — matches ConversationRow's own per-row badge, which is also a message
  // count, not a conversation count, so the two never look inconsistent
  // side by side despite counting different things.
  const unreadConversations = useUnreadConversationsCount();

  return (
    <View style={[styles.bar, { paddingBottom: 16 + insets.bottom }]}>
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        const showBadge = id === "Chat" && unreadConversations > 0;
        return (
          <Pressable
            key={id}
            onPress={() => onNavigate(id)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={showBadge ? `${label}, ${unreadConversations} unread` : label}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon size={20} color={isActive ? colors.primary : colors.subtle} strokeWidth={isActive ? 2.5 : 1.8} />
              {showBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadConversations > 99 ? "99+" : unreadConversations}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 16,
    backgroundColor: colors.background,
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
  badge: {
    position: "absolute",
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
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
