import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { PROFILE_USER } from "../../constants/profileMockData";

import Header from "../../components/Header/Header";
import Card from "../../components/common/Card";
import Avatar from "../../components/Avatar/Avatar";
import Pill from "../../components/common/Pill";
import SettingsSection from "../../components/common/SettingsSection";
import SettingsRow from "../../components/common/SettingsRow";
import Toggle from "../../components/common/Toggle";
import MoonIcon from "../../components/common/MoonIcon";
import SunIcon from "../../components/common/SunIcon";
import GlobeIcon from "../../components/common/GlobeIcon";
import BellIcon from "../../components/common/BellIcon";
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
  const navigation = useNavigation();
  const [dark, setDark] = useState(false);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [location, setLocation] = useState(true);
  const [matching, setMatching] = useState(true);
  const [twofa, setTwofa] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <Card style={styles.profileCard}>
        <Avatar size={48} initials={PROFILE_USER.initials} source={PROFILE_USER.avatar} />
        <View style={styles.profileTextWrap}>
          <Text style={styles.profileName}>{PROFILE_USER.name}</Text>
          <Text style={styles.profileEmail}>alex@example.com</Text>
        </View>
        <Pill label="Pro" variant="primary" />
      </Card>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Appearance">
          <SettingsRow
            icon={dark ? <MoonIcon size={18} color={colors.textLight} /> : <SunIcon size={18} color={colors.textLight} />}
            label="Dark Mode"
            subtitle="Switch between light and dark"
            right={<Toggle on={dark} onChange={setDark} />}
          />
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
            icon={<BellIcon size={18} color={colors.textLight} />}
            label="Push Notifications"
            subtitle="Item matches, claims, messages"
            right={<Toggle on={push} onChange={setPush} />}
          />
          <SettingsRow
            icon={<MailIcon size={18} color={colors.textLight} />}
            label="Email Notifications"
            subtitle="Weekly summary and alerts"
            right={<Toggle on={email} onChange={setEmail} />}
          />
          <SettingsRow
            icon={<ZapIcon size={18} color={colors.textLight} />}
            label="Instant Matching Alerts"
            subtitle="Notify when we find a match"
            right={<Toggle on={matching} onChange={setMatching} />}
            last
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Security">
          <SettingsRow
            icon={<MapPinIcon size={18} color={colors.textLight} />}
            label="Location Sharing"
            subtitle="Used to find nearby items"
            right={<Toggle on={location} onChange={setLocation} />}
          />
          <SettingsRow
            icon={<ShieldIcon size={18} color={colors.textLight} />}
            label="Two-Factor Authentication"
            subtitle={twofa ? "Enabled" : "Not enabled"}
            right={<Toggle on={twofa} onChange={setTwofa} />}
          />
          <SettingsRow
            icon={<EyeIcon size={18} color={colors.textLight} />}
            label="Profile Visibility"
            subtitle="Public to verified users"
          />
          <SettingsRow icon={<FileTextIcon size={18} color={colors.textLight} />} label="Data & Privacy" last />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow icon={<Edit3Icon size={18} color={colors.textLight} />} label="Edit Profile" />
          <SettingsRow icon={<KeyIcon size={18} color={colors.textLight} />} label="Change Password" />
          <SettingsRow
            icon={<AwardIcon size={18} color={colors.textLight} />}
            label="Upgrade to Pro"
            subtitle="Unlock advanced features"
            right={<Pill label="New" variant="amber" />}
          />
          <SettingsRow icon={<HelpCircleIcon size={18} color={colors.textLight} />} label="Help & Support" />
          <SettingsRow
            icon={<InfoIcon size={18} color={colors.textLight} />}
            label="About Foundly"
            subtitle="Version 2.4.1"
            last
          />
        </SettingsSection>

        <SettingsSection title="Danger Zone" style={styles.lastSection}>
          <SettingsRow
            icon={<LogOutIcon size={18} color={colors.danger} />}
            label="Sign Out"
            danger
            right={null}
            onPress={() => navigation.navigate("Login")}
          />
          <SettingsRow
            icon={<Trash2Icon size={18} color={colors.danger} />}
            label="Delete Account"
            subtitle="Permanently remove all data"
            danger
            right={null}
            last
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
