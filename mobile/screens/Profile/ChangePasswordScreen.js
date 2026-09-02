import React, { useRef, useState, useMemo } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { changePassword } from "../../services/users";
import { googleSignIn, appleSignIn } from "../../services/socialAuth";

import Header from "../../components/Header/Header";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import SocialButton from "../../components/common/SocialButton";
import LockIcon from "../../components/common/LockIcon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

// Mirrors validations/auth.validation.js's changePasswordSchema — new
// password min 8 chars — so the form fails fast instead of waiting on a
// round trip for a rule the backend already enforces.
export default function ChangePasswordScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();

  // The backend (auth/me via toPublicUser) independently reports whether
  // this account has a local password; the client only renders, never
  // asserts. Absent the field (e.g. a stale cached session), default to the
  // password flow — the safer assumption.
  const hasPassword = user?.hasPassword !== false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthToken, setReauthToken] = useState(null); // { kind: "google"|"apple", token }
  const [reauthError, setReauthError] = useState("");

  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const isNewPasswordValid = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;

  const reauthNeeded = !hasPassword && !reauthToken;
  const canSubmit = hasPassword
    ? currentPassword.length > 0 && isNewPasswordValid && passwordsMatch
    : Boolean(reauthToken) && isNewPasswordValid && passwordsMatch;

  const handleProviderReauth = async () => {
    if (reauthLoading) return;
    setReauthLoading(true);
    setReauthError("");
    try {
      if (user?.provider === "apple") {
        const credential = await appleSignIn();
        if (!credential.identityToken) throw new Error("Apple sign-in didn't return a token.");
        setReauthToken({ kind: "apple", token: credential.identityToken });
      } else {
        // Default to Google — every social account here is Google unless
        // the backend explicitly said Apple (provider is server-reported).
        const idToken = await googleSignIn();
        setReauthToken({ kind: "google", token: idToken });
      }
    } catch (err) {
      if (err.code !== "CANCELLED") {
        setReauthError(err.message || "Reauthentication failed. Please try again.");
      }
    } finally {
      setReauthLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Belt-and-suspenders alongside the Button's `disabled` prop — see LoginScreen.
    if (!canSubmit || submitting) return;

    setFormError("");
    setSubmitting(true);
    try {
      const proof = hasPassword
        ? { currentPassword }
        : reauthToken.kind === "apple"
        ? { identityToken: reauthToken.token }
        : { idToken: reauthToken.token };
      await changePassword({ ...proof, newPassword });
      Alert.alert("Password changed", "Your password has been updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setFormError(err.message || "Couldn't change your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const providerLabel = user?.provider === "apple" ? "Continue with Apple" : "Continue with Google";
  const providerLoadingLabel =
    user?.provider === "apple" ? "Verifying with Apple..." : "Verifying with Google...";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header title="Change Password" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingScreen>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {hasPassword ? (
            <>
              <Text style={styles.body}>
                Choose a new password. You'll stay signed in on this device.
              </Text>

              <View style={styles.form}>
                <Input
                  label="Current Password"
                  placeholder="Your current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="next"
                  onSubmitEditing={() => newPasswordRef.current?.focus()}
                  icon={<LockIcon size={16} color={colors.textLight} />}
                />

                <Input
                  ref={newPasswordRef}
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  error={newPassword && !isNewPasswordValid ? "Must be at least 8 characters" : undefined}
                  icon={<LockIcon size={16} color={colors.textLight} />}
                />

                <Input
                  ref={confirmPasswordRef}
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
                  icon={<LockIcon size={16} color={colors.textLight} />}
                />

                {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                <Button fullWidth disabled={!canSubmit || submitting} onPress={handleSubmit} style={styles.submitButton}>
                  {submitting ? "Changing..." : "Change Password"}
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.body}>
                You signed up with {user?.provider === "apple" ? "Apple" : "Google"} and don't have
                a Foundly password yet.
              </Text>
              <Text style={styles.body}>
                Set a password to enable email/password login. First, reauthenticate with your{" "}
                {user?.provider === "apple" ? "Apple" : "Google"} account to confirm it's really you.
              </Text>

              {!reauthToken ? (
                <View style={styles.form}>
                  <SocialButton
                    variant={user?.provider === "apple" ? "dark" : "light"}
                    label={reauthLoading ? providerLoadingLabel : providerLabel}
                    onPress={handleProviderReauth}
                    disabled={reauthLoading}
                    style={styles.reauthButton}
                  />
                  {reauthError ? <Text style={styles.formError}>{reauthError}</Text> : null}
                </View>
              ) : (
                <>
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>
                      Identity verified. Now choose a password for your Foundly account.
                    </Text>
                  </View>

                  <View style={styles.form}>
                    <Input
                      ref={newPasswordRef}
                      label="New Password"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      autoComplete="password-new"
                      textContentType="newPassword"
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      error={newPassword && !isNewPasswordValid ? "Must be at least 8 characters" : undefined}
                      icon={<LockIcon size={16} color={colors.textLight} />}
                    />

                    <Input
                      ref={confirmPasswordRef}
                      label="Confirm Password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoComplete="password-new"
                      textContentType="newPassword"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
                      icon={<LockIcon size={16} color={colors.textLight} />}
                    />

                    {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                    <Button fullWidth disabled={!canSubmit || submitting} onPress={handleSubmit} style={styles.submitButton}>
                      {submitting ? "Setting password..." : "Set Password"}
                    </Button>
                  </View>
                </>
              )}
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
  body: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 21,
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  formError: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
  successBox: {
    backgroundColor: colors.primary + "14",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    lineHeight: 19,
  },
  reauthButton: {
    flex: 0,
    width: "100%",
  },
  submitButton: {
    marginTop: 4,
  },
});
