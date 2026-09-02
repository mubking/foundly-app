import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Animated, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import Header from "../../components/Header/Header";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import IconBadge from "../../components/common/IconBadge";
import LockIcon from "../../components/common/LockIcon";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import MailIcon from "../../components/common/MailIcon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPasswordScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formFade = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(10)).current;
  const successFade = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formFade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(formTranslate, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [formFade, formTranslate]);

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  const playSuccessAnimation = () => {
    successFade.setValue(0);
    successScale.setValue(0.95);
    Animated.parallel([
      Animated.timing(successFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(successScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSend = async () => {
    if (!isEmailValid || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
      playSuccessAnimation();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const backToSignIn = () => navigation.navigate("Login");

  const enterCode = () =>
    navigation.navigate("ResetPassword", { email: email.trim().toLowerCase() });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Reset Password" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingScreen>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {!sent ? (
          <Animated.View style={{ opacity: formFade, transform: [{ translateY: formTranslate }] }}>
            <IconBadge size={64} radius={24} backgroundColor={colors.primaryTint} style={styles.badge}>
              <LockIcon size={28} color={colors.primary} strokeWidth={1.8} />
            </IconBadge>

            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.body}>
              No worries! Enter your email and we'll send a 6-digit reset code within seconds.
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
                returnKeyType="send"
                onSubmitEditing={handleSend}
                icon={<MailIcon size={17} color={colors.textLight} />}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button fullWidth onPress={handleSend} disabled={!isEmailValid || submitting}>
                {submitting ? "Sending..." : "Send Reset Code"}
              </Button>

              <Button variant="surface" size="md" fullWidth onPress={backToSignIn}>
                Back to Sign In
              </Button>
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            style={[styles.successWrap, { opacity: successFade, transform: [{ scale: successScale }] }]}
          >
            <IconBadge size={80} radius={24} backgroundColor={colors.greenTint}>
              <CheckCircleIcon size={40} color={colors.success} />
            </IconBadge>

            <View style={styles.successTextBlock}>
              <Text style={[styles.title, styles.center]}>Check your inbox</Text>
              <Text style={[styles.body, styles.center]}>
                If an account exists for{"\n"}
                <Text style={styles.emailText}>{email.trim()}</Text>,{"\n"}
                we've sent a reset code. It expires in 15 minutes.
              </Text>
            </View>

            <Button fullWidth onPress={enterCode} style={styles.successButton}>
              Enter Code
            </Button>

            <Pressable onPress={handleSend} disabled={submitting}>
              <Text style={styles.resendText}>{submitting ? "Resending..." : "Didn't receive it? Resend"}</Text>
            </Pressable>
          </Animated.View>
        )}
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
  center: {
    textAlign: "center",
    marginBottom: 0,
  },
  emailText: {
    fontWeight: "700",
    color: colors.text,
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
  successWrap: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 20,
  },
  successTextBlock: {
    alignItems: "center",
  },
  successButton: {
    width: "100%",
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textLight,
  },
});
