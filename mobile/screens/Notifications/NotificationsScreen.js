import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { NOTIFICATIONS, NOTIFICATION_TYPES } from "../../constants/notificationsMockData";

import Header from "../../components/Header/Header";
import BellIcon from "../../components/common/BellIcon";
import ZapIcon from "../../components/common/ZapIcon";
import SearchIcon from "../../components/common/SearchIcon";
import DollarSignIcon from "../../components/common/DollarSignIcon";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import XIcon from "../../components/common/XIcon";
import NotificationCard from "../../components/common/NotificationCard";
import BottomNav from "../../components/BottomNav/BottomNav";

const ICONS = { zap: ZapIcon, search: SearchIcon, dollar: DollarSignIcon, check: CheckCircleIcon, x: XIcon };

const COLOR_MAP = {
  primary: colors.primary,
  green: colors.success,
  amber: colors.secondary,
  red: colors.danger,
};

const TINT_MAP = {
  primary: colors.primaryTint,
  green: colors.greenTint,
  amber: colors.amberTint,
  red: colors.redTint,
};

const UNREAD_COUNT = NOTIFICATIONS.filter((n) => !n.read).length;

export default function NotificationsScreen() {
  const navigation = useNavigation();

  const handleNavigate = (route) => {
    if (route === "Notifications") return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
        right={
          <Pressable hitSlop={8}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </Pressable>
        }
      />

      {UNREAD_COUNT > 0 ? (
        <View style={styles.unreadBanner}>
          <BellIcon size={16} color={colors.primary} />
          <Text style={styles.unreadText}>{UNREAD_COUNT} unread notifications</Text>
        </View>
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {NOTIFICATIONS.map((notification) => {
          const type = NOTIFICATION_TYPES[notification.type];
          const Icon = ICONS[type.icon];
          const color = COLOR_MAP[type.color];
          const tint = TINT_MAP[type.color];

          return (
            <NotificationCard
              key={notification.id}
              icon={<Icon size={19} color={color} />}
              iconBg={tint}
              iconColor={color}
              title={notification.title}
              body={notification.body}
              time={notification.time}
              read={notification.read}
              style={styles.card}
            />
          );
        })}
      </ScrollView>

      <BottomNav active="Notifications" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    paddingRight: 4,
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
});
