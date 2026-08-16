import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import Header from "../../components/Header/Header";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import IconBadge from "../../components/common/IconBadge";
import LockIcon from "../../components/common/LockIcon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import { useAuth } from "../../context/AuthContext";

export default function ResetPasswordScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(route.params?.email || "");
  const [code, setCode] = useState(route.params?.code || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code.trim());
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isEmailValid && isCodeValid && isPasswordValid && passwordsMatch;

  const handleReset = async () => {
    if (!canSubmit || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await resetPassword({ email: email.trim().toLowerCase(), code: code.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Enter Reset Code" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingScreen keyboardVerticalOffset={60}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconBadge size={64} radius={24} backgroundColor={colors.primaryTint} style={styles.badge}>
            <LockIcon size={28} color={colors.primary} strokeWidth={1.8} />
          </IconBadge>

          <Text style={styles.title}>Enter your code</Text>
          <Text style={styles.body}>
            Enter the 6-digit code we emailed you along with your new password.
          </Text>

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="alex@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <Input
              label="Reset Code"
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              returnKeyType="next"
              hint="6-digit code, expires 15 minutes after it's sent"
            />

            <Input
              label="New Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="next"
            />

            <Input
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleReset}
              error={confirmPassword && !passwordsMatch ? "Passwords don't match" : undefined}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button fullWidth onPress={handleReset} disabled={!canSubmit || submitting}>
              {submitting ? "Resetting..." : "Reset Password"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingScreen>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  badge: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 23,
    marginBottom: 28,
  },
  form: {
    gap: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
});
