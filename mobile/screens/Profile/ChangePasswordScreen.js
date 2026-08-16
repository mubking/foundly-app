import React, { useRef, useState, useMemo } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { changePassword } from "../../services/users";

import Header from "../../components/Header/Header";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

// Mirrors validations/auth.validation.js's changePasswordSchema — new
// password min 8 chars — so the form fails fast instead of waiting on a
// round trip for a rule the backend already enforces.
export default function ChangePasswordScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const isNewPasswordValid = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && isNewPasswordValid && passwordsMatch;

  const handleSubmit = async () => {
    // Belt-and-suspenders alongside the Button's `disabled` prop — see LoginScreen.
    if (!canSubmit || submitting) return;

    setFormError("");
    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert("Password changed", "Your password has been updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setFormError(err.message || "Couldn't change your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header title="Change Password" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingScreen>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Button fullWidth disabled={!canSubmit || submitting} onPress={handleSubmit} style={styles.submitButton}>
              {submitting ? "Changing..." : "Change Password"}
            </Button>
          </View>
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
    marginBottom: 24,
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
  submitButton: {
    marginTop: 4,
  },
});
