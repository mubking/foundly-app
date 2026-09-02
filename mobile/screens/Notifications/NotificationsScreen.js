import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { NOTIFICATION_TYPES } from "../../constants/notificationsMockData";
import { useNotifications } from "../../hooks/useNotifications";
import { getNotificationRoute } from "../../services/notifications";
import { getInitialsFromName } from "../../utils/initials";
import { optimizeImageUrl } from "../../utils/cloudinaryImage";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import BellIcon from "../../components/common/BellIcon";
import ZapIcon from "../../components/common/ZapIcon";
import SearchIcon from "../../components/common/SearchIcon";
import DollarSignIcon from "../../components/common/DollarSignIcon";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import XIcon from "../../components/common/XIcon";
import NotificationCard from "../../components/common/NotificationCard";
import BottomNav from "../../components/BottomNav/BottomNav";

const ICONS = { zap: ZapIcon, search: SearchIcon, dollar: DollarSignIcon, check: CheckCircleIcon, x: XIcon, bell: BellIcon };

// Depend on the active palette, so these are factories called from inside
// the component (see `colorMap`/`tintMap` below) rather than module-level
// constants.
const getColorMap = (colors) => ({
  primary: colors.primary,
  green: colors.success,
  amber: colors.secondary,
  red: colors.danger,
});

const getTintMap = (colors) => ({
  primary: colors.primaryTint,
  green: colors.greenTint,
  amber: colors.amberTint,
  red: colors.redTint,
});

// Falls back to this for any `type` NOTIFICATION_TYPES doesn't recognize —
// see that file for why the set of real values is unknown.
const DEFAULT_TYPE = { icon: "bell", color: "primary" };

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const colorMap = useMemo(() => getColorMap(colors), [colors]);
  const tintMap = useMemo(() => getTintMap(colors), [colors]);
  const {
    notifications,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    unreadCount,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteOne,
  } = useNotifications();
  const [actionError, setActionError] = useState(null);
  const [clearing, setClearing] = useState(false);

  const handleNavigate = (route) => {
    if (route === "Notifications") return;
    navigation.navigate(route);
  };

  // Marks the notification read on open, then navigates to whatever it's
  // about, if anything (getNotificationRoute returns null for
  // notifications with no targetType/targetId — nothing to deep-link to).
  const handleOpen = useCallback(
    async (notification) => {
      if (!notification.isRead) {
        const result = await markAsRead(notification.id);
        setActionError(result.ok ? null : result.message || "Couldn't update that notification.");
      }

      const route = getNotificationRoute(notification);
      if (route) navigation.navigate(route.screen, route.params);
    },
    [markAsRead, navigation]
  );

  const handleMarkAllRead = useCallback(async () => {
    const result = await markAllAsRead();
    setActionError(result.ok ? null : result.message || "Couldn't update notifications.");
  }, [markAllAsRead]);

  // Deletes a single notification — real deletion, not a client-only hide
  // (the backend removes the document, so it stays gone after reload).
  const handleDeleteOne = useCallback(
    async (notification) => {
      setActionError(null);
      const result = await deleteOne(notification.id);
      if (!result.ok) setActionError(result.message || "Couldn't delete that notification.");
    },
    [deleteOne]
  );

  // Destructive bulk action — confirm first, then delete server-side and
  // clear local state. Only the caller's own notifications are affected.
  const handleClearAll = useCallback(() => {
    if (clearing || notifications.length === 0) return;
    setActionError(null);
    Alert.alert(
      "Clear all notifications?",
      "This permanently removes all of your notifications. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            const result = await clearAll();
            setClearing(false);
            if (!result.ok) setActionError(result.message || "Couldn't clear notifications.");
          },
        },
      ]
    );
  }, [clearing, notifications.length, clearAll]);

  const renderItem = useCallback(
    ({ item }) => {
      const type = NOTIFICATION_TYPES[item.type] || DEFAULT_TYPE;
      const Icon = ICONS[type.icon];
      const color = colorMap[type.color];
      const tint = tintMap[type.color];
      const isMessage = !!type.sender;

      return (
        <NotificationCard
          icon={<Icon size={19} color={color} />}
          iconBg={tint}
          iconColor={color}
          avatar={isMessage ? (item.senderAvatar ? { uri: optimizeImageUrl(item.senderAvatar, "avatar") } : null) : undefined}
          avatarInitials={isMessage ? getInitialsFromName(item.title) : undefined}
          title={item.title}
          body={item.message}
          meta={isMessage && item.itemTitle ? `Re: ${item.itemTitle}` : undefined}
          time={item.time}
          read={item.isRead}
          onPress={() => handleOpen(item)}
          onDelete={() => handleDeleteOne(item)}
          style={styles.card}
        />
      );
    },
    [handleOpen, handleDeleteOne, colorMap, tintMap, styles]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
        right={
          notifications.length > 0 ? (
            <View style={styles.headerActions}>
              {unreadCount > 0 ? (
                <Pressable
                  hitSlop={8}
                  onPress={handleMarkAllRead}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                >
                  <Text style={styles.headerActionText}>Mark all read</Text>
                </Pressable>
              ) : null}
              <Pressable
                hitSlop={8}
                onPress={handleClearAll}
                disabled={clearing}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
              >
                <Text style={[styles.headerActionText, styles.clearAllText]}>
                  {clearing ? "Clearing…" : "Clear all"}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />

      {unreadCount > 0 ? (
        <View style={styles.unreadBanner}>
          <BellIcon size={16} color={colors.primary} />
          <Text style={styles.unreadText}>{unreadCount} unread notifications</Text>
        </View>
      ) : null}

      {actionError ? <Text style={styles.actionErrorText}>{actionError}</Text> : null}

      {loading ? (
        <StatusState loading />
      ) : error ? (
        <StatusState message={error} actionLabel="Retry" onAction={refresh} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={<Text style={styles.emptyText}>You're all caught up — no notifications yet.</Text>}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
            ) : notifications.length > 0 && !hasMore ? (
              <Text style={styles.endText}>You've seen it all</Text>
            ) : null
          }
        />
      )}

      <BottomNav active="Notifications" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 4,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  clearAllText: {
    color: colors.danger,
  },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
  },
  unreadText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  card: {
    marginBottom: 0,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 40,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  endText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 16,
  },
  actionErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 12,
  },
});
