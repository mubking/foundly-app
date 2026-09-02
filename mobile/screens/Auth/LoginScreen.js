import React, { useRef, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { useTheme } from "../../context/ThemeContext";
import Header from "../../components/Header/Header";
import BrandMark from "../../components/common/BrandMark";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Divider from "../../components/common/Divider";
import SocialButton from "../../components/common/SocialButton";
import MailIcon from "../../components/common/MailIcon";
import LockIcon from "../../components/common/LockIcon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import { useAuth } from "../../context/AuthContext";
import { googleSignIn, appleSignIn } from "../../services/socialAuth";

export default function LoginScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // "google" | "apple" | null

  const passwordRef = useRef(null);

  const handleSignIn = async () => {
    // Belt-and-suspenders alongside the Button's `disabled` prop: closes
    // the tiny window where a second tap could land before the disabled
    // state has re-rendered.
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const socialSignInHandlers = {
    google: async () => {
      const idToken = await googleSignIn();
      await loginWithGoogle(idToken);
    },
    apple: async () => {
      const credential = await appleSignIn();
      await loginWithApple(credential);
    },
  };

  const handleSocialSignIn = async (provider) => {
    if (submitting || socialLoading) return;
    setError("");
    setSocialLoading(provider);
    try {
      await socialSignInHandlers[provider]();
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err) {
      if (err.code !== "CANCELLED") {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header onBack={() => navigation.goBack()} />

      <KeyboardAvoidingScreen>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandMark style={styles.brand} />

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your Reunio account.</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="alex@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              icon={<MailIcon size={17} color={colors.textLight} />}
            />

            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
              icon={<LockIcon size={16} color={colors.textLight} />}
            />

            <Pressable onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              fullWidth
              onPress={handleSignIn}
              disabled={submitting || !email || !password}
              style={styles.signInButton}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>

            <Divider label="or" />

            <View style={styles.socialRow}>
              <SocialButton
                variant="light"
                icon={<FontAwesome name="google" size={16} color={colors.text} />}
                label={socialLoading === "google" ? "Signing in..." : "Google"}
                onPress={() => handleSocialSignIn("google")}
                disabled={submitting || !!socialLoading}
              />
              {Platform.OS === "ios" && (
                <SocialButton
                  variant="dark"
                  icon={<FontAwesome name="apple" size={18} color="#fff" />}
                  label={socialLoading === "apple" ? "Signing in..." : "Apple"}
                  onPress={() => handleSocialSignIn("apple")}
                  disabled={submitting || !!socialLoading}
                />
              )}
            </View>

            <Text style={styles.footerText}>
              No account?{" "}
              <Text style={styles.footerLink} onPress={() => navigation.navigate("Signup")}>
                Sign up free
              </Text>
            </Text>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brand: {
    marginTop: 8,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  forgotButton: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
  signInButton: {
    marginTop: 4,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  footerLink: {
    fontWeight: "600",
    color: colors.primary,
  },
});


