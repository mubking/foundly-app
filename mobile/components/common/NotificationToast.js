import React, { useMemo } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { NOTIFICATION_TYPES } from "../../constants/notificationsMockData";
import { getInitialsFromName } from "../../utils/initials";

import Avatar from "../Avatar/Avatar";
import BellIcon from "./BellIcon";
import ZapIcon from "./ZapIcon";
import SearchIcon from "./SearchIcon";
import DollarSignIcon from "./DollarSignIcon";
import CheckCircleIcon from "./CheckCircleIcon";
import XIcon from "./XIcon";

// Same icon/color-by-type mapping NotificationsScreen uses, kept local to
// each component (both are small lookups from the shared NOTIFICATION_TYPES
// data, same pattern NotificationsScreen already established).
const ICONS = { zap: ZapIcon, search: SearchIcon, dollar: DollarSignIcon, check: CheckCircleIcon, x: XIcon, bell: BellIcon };
// Depend on the active palette, so these are factories called from inside
// the component (see `colorMap`/`tintMap` below) rather than module-level
// constants.
const getColorMap = (colors) => ({ primary: colors.primary, green: colors.success, amber: colors.secondary, red: colors.danger });
const getTintMap = (colors) => ({ primary: colors.primaryTint, green: colors.greenTint, amber: colors.amberTint, red: colors.redTint });
const DEFAULT_TYPE = { icon: "bell", color: "primary" };

/**
 * Global floating banner for one incoming notification — rendered above
 * whatever screen is currently on top (see NotificationToastHost). Visual
 * language matches NotificationCard/MatchAlertBanner, just repositioned as
 * an overlay instead of inline list/page content.
 */
export default function NotificationToast({ notification, onPress, onDismiss }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const colorMap = useMemo(() => getColorMap(colors), [colors]);
  const tintMap = useMemo(() => getTintMap(colors), [colors]);

  if (!notification) return null;

  const type = NOTIFICATION_TYPES[notification.type] || DEFAULT_TYPE;
  const Icon = ICONS[type.icon];
  const color = colorMap[type.color];
  const tint = tintMap[type.color];
  const isMessage = !!type.sender;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]} pointerEvents="box-none">
      <Pressable onPress={onPress} style={[styles.card, { borderColor: `${color}33` }]}>
        {isMessage ? (
          <Avatar
            size={36}
            initials={getInitialsFromName(notification.title)}
            source={notification.senderAvatar ? { uri: notification.senderAvatar } : null}
          />
        ) : (
          <View style={[styles.iconBadge, { backgroundColor: tint }]}>
            <Icon size={18} color={color} />
          </View>
        )}

        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.message}
          </Text>
          {isMessage && notification.itemTitle ? (
            <Text style={styles.meta} numberOfLines={1}>
              Re: {notification.itemTitle}
            </Text>
          ) : null}
        </View>

        <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismissButton}>
          <XIcon size={14} color={colors.subtle} />
        </Pressable>
      </Pressable>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textLight,
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    fontStyle: "italic",
    color: colors.subtle,
    marginTop: 2,
  },
  dismissButton: {
    padding: 4,
  },
});
