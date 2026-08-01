import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { PROFILE_USER, TRUST_SCORE, ACHIEVEMENTS, PROFILE_MENU } from "../../constants/profileMockData";

import ProfileHeader from "../../components/common/ProfileHeader";
import Pill from "../../components/common/Pill";
import TrustScoreCard from "../../components/common/TrustScoreCard";
import AchievementsRow from "../../components/common/AchievementsRow";
import MenuRow from "../../components/common/MenuRow";
import PackageIcon from "../../components/common/PackageIcon";
import SearchIcon from "../../components/common/SearchIcon";
import GiftIcon from "../../components/common/GiftIcon";
import MessageCircleIcon from "../../components/common/MessageCircleIcon";
import SettingsIcon from "../../components/common/SettingsIcon";
import LogOutIcon from "../../components/common/LogOutIcon";
import BottomNav from "../../components/BottomNav/BottomNav";

const MENU_ICONS = {
  package: PackageIcon,
  search: SearchIcon,
  gift: GiftIcon,
  message: MessageCircleIcon,
  settings: SettingsIcon,
};

export default function ProfileScreen() {
  const navigation = useNavigation();

  const handleNavigate = (route) => {
    if (route === "Profile") return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader user={PROFILE_USER} onSettingsPress={() => navigation.navigate("Settings")} />

        <View style={styles.info}>
          <View style={styles.identityRow}>
            <View style={styles.identityText}>
              <Text style={styles.name}>{PROFILE_USER.name}</Text>
              <Text style={styles.handle}>
                {PROFILE_USER.handle} · {PROFILE_USER.location}
              </Text>
              <View style={styles.pillRow}>
                <Pill label="Verified" variant="green" dot />
                <Pill label="Top Returner" variant="amber" dot />
              </View>
            </View>

            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          </View>

          <TrustScoreCard
            score={TRUST_SCORE.score}
            maxScore={TRUST_SCORE.maxScore}
            percent={TRUST_SCORE.percent}
            stats={TRUST_SCORE.stats}
            style={styles.trustCard}
          />

          <View style={styles.achievementsSection}>
            <Text style={styles.sectionLabel}>Achievements</Text>
            <AchievementsRow achievements={ACHIEVEMENTS} />
          </View>

          <View style={styles.menu}>
            {PROFILE_MENU.map((item) => {
              const Icon = MENU_ICONS[item.icon];
              return (
                <MenuRow
                  key={item.key}
                  icon={<Icon size={19} color={item.color} />}
                  iconColor={item.color}
                  label={item.label}
                  subtitle={item.subtitle}
                  badge={item.badge}
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
              onPress={() => navigation.navigate("Login")}
              style={styles.signOutRow}
            />
          </View>
        </View>
      </ScrollView>

      <BottomNav active="Profile" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
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
  trustCard: {
    marginBottom: 16,
  },
  achievementsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  menu: {
    gap: 8,
  },
  signOutRow: {
    marginTop: 4,
  },
});
