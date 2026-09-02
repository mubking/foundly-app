import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../services/users";
import { googleSignIn, appleSignIn } from "../../services/socialAuth";

import Header from "../../components/Header/Header";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import SocialButton from "../../components/common/SocialButton";
import IconBadge from "../../components/common/IconBadge";
import Trash2Icon from "../../components/common/Trash2Icon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

const CONSEQUENCES = [
  "Your account will be deactivated and you won't be able to sign back in.",
  "Your profile, lost/found reports, claims, and conversations will no longer be visible to other users.",
  "Your account data is retained by Foundly (it is not deleted). This can't be undone from inside the app.",
];

// Settings > Danger Zone > Delete Account. Reauthentication is always
// required before the destructive call — password confirmation for accounts
// that have one, a verified Google/Apple reauthentication for social-only
// accounts (never a skipped check; the backend independently decides which
// proof it needs and rejects a passwordless deactivation). On success the
// session is exactly as invalid as a banned/suspended one, so this reuses
// `logout()` to clear it locally and resets the stack to Login, same as
// useLogout.
export default function DeleteAccountScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // The backend (auth/me via toPublicUser) independently reports whether
  // this account has a local password; the client only renders, never
  // asserts. Absent the field (e.g. a stale cached session), default to the
  // password flow — the safer assumption.
  const hasPassword = user?.hasPassword !== false;

  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthToken, setReauthToken] = useState(null); // { kind: "google"|"apple", token }

  const providerLabel = user?.provider === "apple" ? "Continue with Apple" : "Continue with Google";
  const providerLoadingLabel =
    user?.provider === "apple" ? "Verifying with Apple..." : "Verifying with Google...";

  const handleProviderReauth = async () => {
    if (reauthLoading) return;
    setReauthLoading(true);
    setFormError("");
    try {
      let proof;
      if (user?.provider === "apple") {
        const credential = await appleSignIn();
        if (!credential.identityToken) throw new Error("Apple sign-in didn't return a token.");
        proof = { kind: "apple", token: credential.identityToken };
      } else {
        // Default to Google — every social account here is Google unless
        // the backend explicitly said Apple (provider is server-reported).
        const idToken = await googleSignIn();
        proof = { kind: "google", token: idToken };
      }
      setReauthToken(proof);
      // Reauthentication succeeded — now show the final destructive confirm.
      handleDelete(proof);
    } catch (err) {
      if (err.code !== "CANCELLED") {
        setFormError(err.message || "Reauthentication failed. Please try again.");
      }
    } finally {
      setReauthLoading(false);
    }
  };

  const handleDelete = (proofOverride) => {
    Alert.alert(
      "Deactivate your account?",
      "This deactivates your Reunio account and hides your activity from other users. Your data is retained and this can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate Account", style: "destructive", onPress: () => confirmDelete(proofOverride) },
      ]
    );
  };

  const confirmDelete = async (proofOverride) => {
    if (submitting) return;
    setFormError("");
    setSubmitting(true);
    try {
      const proof = proofOverride || (hasPassword ? { password } : reauthToken);
      await deleteAccount({
        ...(proof?.password ? { password: proof.password } : {}),
        ...(proof?.kind === "apple" ? { identityToken: proof.token } : {}),
        ...(proof?.kind === "google" ? { idToken: proof.token } : {}),
      });
      await logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      setFormError(err.message || "Couldn't deactivate your account. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header title="Deactivate Account" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingScreen>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconBadge size={64} radius={24} backgroundColor={colors.redTint} style={styles.badge}>
            <Trash2Icon size={28} color={colors.danger} />
          </IconBadge>

          <Text style={styles.title}>This will deactivate your Reunio account</Text>
          <Text style={styles.body}>Before you continue, please know that:</Text>

          <View style={styles.list}>
            {CONSEQUENCES.map((line) => (
              <View key={line} style={styles.listRow}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{line}</Text>
              </View>
            ))}
          </View>

          {hasPassword ? (
            <View style={styles.form}>
              <Input
                label="Confirm Your Password"
                placeholder="Your current password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => handleDelete()}
              />

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <Button
                fullWidth
                variant="red"
                disabled={submitting || password.length === 0}
                onPress={() => handleDelete()}
                style={styles.deleteButton}
              >
                {submitting ? "Deactivating account..." : "Deactivate Account"}
              </Button>
            </View>
          ) : (
            <>
              <Text style={styles.body}>
                You signed up with {user?.provider === "apple" ? "Apple" : "Google"} and don't have
                a Foundly password. Reauthenticate with your{" "}
                {user?.provider === "apple" ? "Apple" : "Google"} account to confirm it's really you
                before deactivating.
              </Text>

              <View style={styles.form}>
                <SocialButton
                  variant={user?.provider === "apple" ? "dark" : "light"}
                  label={reauthLoading ? providerLoadingLabel : providerLabel}
                  onPress={handleProviderReauth}
                  disabled={reauthLoading || submitting}
                  style={styles.reauthButton}
                />
                {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingScreen>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  badge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    marginBottom: 28,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.danger,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink2,
    lineHeight: 19,
  },
  form: {
    gap: 12,
  },
  formError: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
  reauthButton: {
    flex: 0,
    width: "100%",
  },
  deleteButton: {
    marginTop: 4,
  },
});
