import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import Header from "../../components/Header/Header";

// Real, app-specific first-draft copy reflecting what Reunio actually does
// (account creation, lost/found reports with photos/location, claims +
// verification, chat, push/email notifications, admin moderation) — not
// boilerplate copied from elsewhere. Written to be honest placeholder
// content so the in-app links aren't dead, but this hasn't been reviewed
// by counsel and should be before a real store submission.
const DOCS = {
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "Using Reunio",
        body:
          "Reunio helps people report, search for, and reunite with lost belongings within their community. " +
          "You must create an account to report or claim items. You're responsible for keeping your login " +
          "credentials secure and for the accuracy of what you post.",
      },
      {
        heading: "Reporting items",
        body:
          "Lost and found reports should be truthful and describe an item you've actually lost or found. " +
          "Don't post reports for items you don't have, and don't use photos, descriptions, or locations that " +
          "could mislead another user.",
      },
      {
        heading: "Claims",
        body:
          "When you claim an item, you're asserting it belongs to you. Reunio's verification steps (identifying " +
          "details, photos, or other proof) exist to protect both the finder and the rightful owner — providing " +
          "false claim information may result in your account being suspended.",
      },
      {
        heading: "Community conduct",
        body:
          "Be respectful in chat and in your listings. Harassment, fraud, and attempts to use Reunio to buy or " +
          "sell items rather than return lost property are not allowed and may lead to account suspension or " +
          "removal.",
      },
      {
        heading: "Account suspension & deletion",
        body:
          "We may suspend or ban accounts that violate these terms. You can delete your own account at any time " +
          "from Settings — this deactivates your account immediately.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "What we collect",
        body:
          "Account details you provide (name, email, phone), photos and descriptions you attach to lost/found " +
          "reports and claims, messages you send in chat, and — only if you grant permission — your device's " +
          "location, camera, and photo library, used to attach a location to reports and to let you take or " +
          "choose photos.",
      },
      {
        heading: "How it's used",
        body:
          "To operate core features: matching lost items to found items, showing nearby reports, verifying " +
          "claims, and notifying you (push and, if enabled, email) about matches, claim updates, and messages.",
      },
      {
        heading: "Sharing",
        body:
          "Other users can see the details you choose to include on a public report (photos, description, " +
          "approximate location) and your name when you message them about an item. We don't sell your personal " +
          "data.",
      },
      {
        heading: "Your controls",
        body:
          "You can edit your profile, turn off email notifications, and permanently delete your account from " +
          "Settings at any time. Deleting your account deactivates it immediately.",
      },
      {
        heading: "Sign in with Google / Apple",
        body:
          "If you sign in with Google or Apple, we only receive the verified identity token needed to create or " +
          "match your account — we never see your Google or Apple password.",
      },
    ],
  },
};

export default function LegalScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const doc = DOCS[route.params?.doc] || DOCS.terms;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header title={doc.title} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20,
  },
  section: {
    gap: 6,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.ink2,
  },
});
