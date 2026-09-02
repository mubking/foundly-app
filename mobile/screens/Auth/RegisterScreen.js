import React, { useRef, useState, useMemo } from "react";
import { View, Text, ScrollView, Alert, Platform, StyleSheet } from "react-native";
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
import UserIcon from "../../components/common/UserIcon";
import MailIcon from "../../components/common/MailIcon";
import PhoneIcon from "../../components/common/PhoneIcon";
import LockIcon from "../../components/common/LockIcon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";
import { useAuth } from "../../context/AuthContext";
import { googleSignIn, appleSignIn } from "../../services/socialAuth";

export default function RegisterScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { register, loginWithGoogle, loginWithApple } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // "google" | "apple" | null

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  const handleCreateAccount = async () => {
    // Belt-and-suspenders alongside the Button's `disabled` prop: closes
    // the tiny window where a second tap could land before the disabled
    // state has re-rendered.
    if (submitting) return;
    setError("");

    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(" ");
    if (!firstName || !lastName) {
      setError("Please enter your first and last name");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ firstName, lastName, email, password, phone });
      // Register doesn't return a session token, so the user signs in
      // with their new credentials rather than landing in the app directly.
      Alert.alert("Account created", "Please sign in with your new account.", [
        {
          text: "OK",
          onPress: () => navigation.reset({ index: 0, routes: [{ name: "Login" }] }),
        },
      ]);
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

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join the community recovering what matters most.</Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Alex Johnson"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              icon={<UserIcon size={17} color={colors.textLight} />}
            />

            <Input
              ref={emailRef}
              label="Email"
              placeholder="alex@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              icon={<MailIcon size={17} color={colors.textLight} />}
            />

            <Input
              ref={phoneRef}
              label="Phone"
              placeholder="+1 555 123 4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              icon={<PhoneIcon size={17} color={colors.textLight} />}
            />

            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleCreateAccount}
              hint="Use letters, numbers, and symbols"
              icon={<LockIcon size={16} color={colors.textLight} />}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              fullWidth
              onPress={handleCreateAccount}
              disabled={submitting || !name || !email || !phone || password.length < 8}
              style={styles.createButton}
            >
              {submitting ? "Creating account..." : "Create Account"}
            </Button>

            <Divider label="or continue with" />

            <View style={styles.socialRow}>
              <SocialButton
                variant="light"
                icon={<FontAwesome name="google" size={16} color={colors.text} />}
                label={socialLoading === "google" ? "Signing in..." : "Continue with Google"}
                onPress={() => handleSocialSignIn("google")}
                disabled={submitting || !!socialLoading}
              />
              {Platform.OS === "ios" && (
                <SocialButton
                  variant="dark"
                  icon={<FontAwesome name="apple" size={18} color="#fff" />}
                  label={socialLoading === "apple" ? "Signing in..." : "Continue with Apple"}
                  onPress={() => handleSocialSignIn("apple")}
                  disabled={submitting || !!socialLoading}
                />
              )}
            </View>

            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.footerLink} onPress={() => navigation.navigate("Login")}>
                Sign in
              </Text>
            </Text>

            <Text style={styles.legalText}>
              By continuing you agree to our{" "}
              <Text style={styles.legalLink} onPress={() => navigation.navigate("Legal", { doc: "terms" })}>
                Terms
              </Text>{" "}
              and{" "}
              <Text style={styles.legalLink} onPress={() => navigation.navigate("Legal", { doc: "privacy" })}>
                Privacy Policy
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
    lineHeight: 20,
    marginBottom: 32,
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
  createButton: {
    marginTop: 8,
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
  legalText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: colors.subtle,
  },
  legalLink: {
    fontWeight: "600",
    color: colors.primary,
  },
});
