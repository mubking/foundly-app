import React, { useState, useMemo, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";

import { useTheme, useThemePreference } from "../../context/ThemeContext";
import { useProfile } from "../../hooks/useProfile";
import { useLogout } from "../../hooks/useLogout";
import { getInitials } from "../../utils/initials";

import Header from "../../components/Header/Header";
import Card from "../../components/common/Card";
import Avatar from "../../components/Avatar/Avatar";
import SettingsSection from "../../components/common/SettingsSection";
import SettingsRow from "../../components/common/SettingsRow";
import Toggle from "../../components/common/Toggle";
import MoonIcon from "../../components/common/MoonIcon";
import SunIcon from "../../components/common/SunIcon";
import GlobeIcon from "../../components/common/GlobeIcon";
import MailIcon from "../../components/common/MailIcon";
import ZapIcon from "../../components/common/ZapIcon";
import MapPinIcon from "../../components/common/MapPinIcon";
import ShieldIcon from "../../components/common/ShieldIcon";
import EyeIcon from "../../components/common/EyeIcon";
import FileTextIcon from "../../components/common/FileTextIcon";
import Edit3Icon from "../../components/common/Edit3Icon";
import KeyIcon from "../../components/common/KeyIcon";
import AwardIcon from "../../components/common/AwardIcon";
import HelpCircleIcon from "../../components/common/HelpCircleIcon";
import InfoIcon from "../../components/common/InfoIcon";
import LogOutIcon from "../../components/common/LogOutIcon";
import Trash2Icon from "../../components/common/Trash2Icon";

export default function SettingsScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { mode, preference, setThemePreference } = useThemePreference();
  const navigation = useNavigation();
  const { profile, loading, error, updateProfile, refresh } = useProfile();
  const insets = useSafeAreaInsets();
  const handleSignOut = useLogout();

  // Dark Mode persists via ThemeContext (AsyncStorage, see context/ThemeContext.js)
  // and Email Notifications persists via the real User.emailNotifications
  // backend field (PATCH /api/users/profile — see services/users.js). The
  // rest below still have no backend model/route for them, so they stay
  // local UI state, disabled, same as before.
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [location, setLocation] = useState(true);
  const [matching, setMatching] = useState(true);
  const [twofa, setTwofa] = useState(false);

  const emailSavingRef = useRef(false);
  const handleEmailToggle = async (next) => {
    if (emailSavingRef.current) return;
    emailSavingRef.current = true;
    setEmailError("");
    setEmailSaving(true);
    const result = await updateProfile({ emailNotifications: next });
    emailSavingRef.current = false;
    setEmailSaving(false);
    if (!result.ok) setEmailError(result.message);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <Card style={styles.profileCard}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : profile ? (
          <>
            <Avatar size={48} initials={getInitials(profile)} source={profile.avatar} />
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
          </>
        ) : (
          <View style={styles.profileTextWrap}>
            <Text style={styles.profileError}>{error || "Couldn't load your profile."}</Text>
            <Text style={styles.retryLink} onPress={refresh}>
              Retry
            </Text>
          </View>
        )}
      </Card>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Appearance">
          <SettingsRow
            icon={mode === "dark" ? <MoonIcon size={18} color={colors.textLight} /> : <SunIcon size={18} color={colors.textLight} />}
            label="Dark Mode"
            subtitle={preference === "system" ? "Matches your device" : undefined}
            right={
              <Toggle
                on={mode === "dark"}
                onChange={(next) => setThemePreference(next ? "dark" : "light")}
                accessibilityLabel="Dark Mode"
              />
            }
          />
          {preference !== "system" ? (
            <SettingsRow
              icon={<SunIcon size={18} color={colors.textLight} />}
              label="Use Device Setting"
              onPress={() => setThemePreference("system")}
            />
          ) : null}
          <SettingsRow
            icon={<GlobeIcon size={18} color={colors.textLight} />}
            label="Language"
            subtitle="English (US)"
            right={<Text style={styles.rowValue}>EN</Text>}
            last
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            icon={<MailIcon size={18} color={colors.textLight} />}
            label="Email Notifications"
            subtitle={emailError || undefined}
            right={
              <Toggle
                on={!!profile?.emailNotifications}
                onChange={handleEmailToggle}
                disabled={emailSaving || !profile}
                accessibilityLabel="Email Notifications"
              />
            }
          />
          <SettingsRow
            icon={<ZapIcon size={18} color={colors.textLight} />}
            label="Instant Matching Alerts"
            subtitle="Coming soon"
            right={<Toggle on={matching} onChange={setMatching} disabled accessibilityLabel="Instant Matching Alerts" />}
            last
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Security">
          <SettingsRow
            icon={<MapPinIcon size={18} color={colors.textLight} />}
            label="Location Sharing"
            subtitle="Coming soon"
            right={<Toggle on={location} onChange={setLocation} disabled accessibilityLabel="Location Sharing" />}
          />
          <SettingsRow
            icon={<ShieldIcon size={18} color={colors.textLight} />}
            label="Two-Factor Authentication"
            subtitle="Coming soon"
            right={<Toggle on={twofa} onChange={setTwofa} disabled accessibilityLabel="Two-Factor Authentication" />}
          />
          <SettingsRow
            icon={<EyeIcon size={18} color={colors.textLight} />}
            label="Profile Visibility"
            subtitle="Public to verified users"
            right={null}
          />
          <SettingsRow
            icon={<ShieldIcon size={18} color={colors.textLight} />}
            label="Blocked Users"
            onPress={() => navigation.navigate("BlockedUsers")}
          />
          <SettingsRow
            icon={<FileTextIcon size={18} color={colors.textLight} />}
            label="Data & Privacy"
            subtitle="Coming soon"
            right={null}
          />
          <SettingsRow
            icon={<FileTextIcon size={18} color={colors.textLight} />}
            label="Privacy Policy"
            onPress={() => navigation.navigate("Legal", { doc: "privacy" })}
          />
          <SettingsRow
            icon={<FileTextIcon size={18} color={colors.textLight} />}
            label="Terms of Service"
            onPress={() => navigation.navigate("Legal", { doc: "terms" })}
            last
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            icon={<Edit3Icon size={18} color={colors.textLight} />}
            label="Edit Profile"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <SettingsRow
            icon={<KeyIcon size={18} color={colors.textLight} />}
            label="Change Password"
            onPress={() => navigation.navigate("ChangePassword")}
          />
          <SettingsRow
            icon={<AwardIcon size={18} color={colors.textLight} />}
            label="Upgrade to Pro"
            subtitle="Coming soon"
            right={null}
          />
          <SettingsRow
            icon={<HelpCircleIcon size={18} color={colors.textLight} />}
            label="Help & Support"
            subtitle="Coming soon"
            right={null}
          />
          <SettingsRow
            icon={<InfoIcon size={18} color={colors.textLight} />}
            label="About Reunio"
            subtitle={`Version ${Constants.expoConfig?.version || "1.0.0"}`}
            right={null}
            last
          />
        </SettingsSection>

        <SettingsSection title="Danger Zone" style={styles.lastSection}>
          <SettingsRow
            icon={<LogOutIcon size={18} color={colors.danger} />}
            label="Sign Out"
            danger
            right={null}
            onPress={handleSignOut}
          />
          <SettingsRow
            icon={<Trash2Icon size={18} color={colors.danger} />}
            label="Deactivate Account"
            danger
            right={null}
            onPress={() => navigation.navigate("DeleteAccount")}
            last
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    minHeight: 48,
  },
  profileTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textLight,
  },
  profileError: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
  },
  retryLink: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLight,
  },
  lastSection: {
    marginBottom: 0,
  },
});
