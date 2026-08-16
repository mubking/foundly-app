import React, { useCallback, useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { PROFILE_MENU } from "../../constants/profileMockData";
import { useProfile } from "../../hooks/useProfile";
import { useProfileStats } from "../../hooks/useProfileStats";
import { useLogout } from "../../hooks/useLogout";
import { getInitials } from "../../utils/initials";

import ProfileHeader from "../../components/common/ProfileHeader";
import StatusState from "../../components/common/StatusState";
import Pill from "../../components/common/Pill";
import MenuRow from "../../components/common/MenuRow";
import PackageIcon from "../../components/common/PackageIcon";
import SearchIcon from "../../components/common/SearchIcon";
import GiftIcon from "../../components/common/GiftIcon";
import MessageCircleIcon from "../../components/common/MessageCircleIcon";
import ShieldIcon from "../../components/common/ShieldIcon";
import SettingsIcon from "../../components/common/SettingsIcon";
import ZapIcon from "../../components/common/ZapIcon";
import LogOutIcon from "../../components/common/LogOutIcon";
import BottomNav from "../../components/BottomNav/BottomNav";

const MENU_ICONS = {
  package: PackageIcon,
  search: SearchIcon,
  gift: GiftIcon,
  message: MessageCircleIcon,
  shield: ShieldIcon,
  settings: SettingsIcon,
  zap: ZapIcon,
};

// Real subtitle/badge for the menu rows that used to carry a hardcoded
// count — null while a count hasn't loaded (or failed to), so the row just
// renders without one instead of showing a stale or fabricated number.
function statsForMenuKey(key, stats) {
  switch (key) {
    case "myLost":
      return stats.lostCount == null
        ? {}
        : { subtitle: `${stats.lostCount} report${stats.lostCount === 1 ? "" : "s"}`, badge: String(stats.lostCount) };
    case "myFound":
      return stats.foundCount == null
        ? {}
        : { subtitle: `${stats.foundCount} item${stats.foundCount === 1 ? "" : "s"}`, badge: String(stats.foundCount) };
    case "messages":
      return stats.unreadCount == null
        ? {}
        : {
            subtitle: stats.unreadCount === 0 ? "No unread conversations" : `${stats.unreadCount} unread conversation${stats.unreadCount === 1 ? "" : "s"}`,
            badge: stats.unreadCount > 0 ? String(stats.unreadCount) : null,
          };
    default:
      return {};
  }
}

export default function ProfileScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { profile, loading, refreshing, error, refresh } = useProfile();
  const stats = useProfileStats();
  const handleSignOut = useLogout();

  // Silent background refresh whenever Profile regains focus (e.g. after
  // saving on EditProfileScreen) — `refresh()` drives `refreshing`, not
  // `loading`, so this doesn't flash a full loading state on every return.
  useFocusEffect(
    useCallback(() => {
      refresh();
      stats.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleNavigate = (route) => {
    if (route === "Profile") return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {loading ? (
        <StatusState loading />
      ) : !profile ? (
        <StatusState message={error || "Couldn't load your profile."} actionLabel="Retry" onAction={refresh} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        >
          <ProfileHeader
            user={{ initials: getInitials(profile), avatar: profile.avatar }}
            onSettingsPress={() => navigation.navigate("Settings")}
            onEditAvatarPress={() => navigation.navigate("EditProfile")}
          />

          <View style={styles.info}>
            <View style={styles.identityRow}>
              <View style={styles.identityText}>
                <Text style={styles.name}>
                  {profile.firstName} {profile.lastName}
                </Text>
                <Text style={styles.handle}>{profile.email}</Text>
                {profile.isVerified ? (
                  <View style={styles.pillRow}>
                    <Pill label="Verified" variant="green" dot />
                  </View>
                ) : null}
              </View>

              <Pressable style={styles.editButton} onPress={() => navigation.navigate("EditProfile")}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </Pressable>
            </View>

            <View style={styles.menu}>
              {PROFILE_MENU.map((item) => {
                const Icon = MENU_ICONS[item.icon];
                const { subtitle = item.subtitle, badge = item.badge } = statsForMenuKey(item.key, stats);
                return (
                  <MenuRow
                    key={item.key}
                    icon={<Icon size={19} color={item.color} />}
                    iconColor={item.color}
                    label={item.label}
                    subtitle={subtitle}
                    badge={badge}
                    onPress={() => navigation.navigate(item.route)}
                  />
                );
              })}

              <MenuRow
                icon={<LogOutIcon size={19} color={colors.danger} />}
                iconColor={colors.danger}
                label="Sign Out"
                labelColor={colors.danger}
                showChevron={false}
                onPress={handleSignOut}
                style={styles.signOutRow}
              />
            </View>
          </View>
        </ScrollView>
      )}

      <BottomNav active="Profile" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  info: {
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  handle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink2,
  },
  menu: {
    gap: 8,
  },
  signOutRow: {
    marginTop: 4,
  },
});
