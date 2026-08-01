import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import Header from "../../components/Header/Header";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import IconBadge from "../../components/common/IconBadge";
import LockIcon from "../../components/common/LockIcon";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import MailIcon from "../../components/common/MailIcon";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

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

  const handleSend = () => {
    setSent(true);
    successFade.setValue(0);
    successScale.setValue(0.95);
    Animated.parallel([
      Animated.timing(successFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(successScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  };

  const backToSignIn = () => navigation.navigate("Login");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Reset Password" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
              No worries! Enter your email and we'll send a secure reset link within seconds.
            </Text>

            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="alex@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<MailIcon size={17} color={colors.textLight} />}
              />

              <Button fullWidth onPress={handleSend}>
                Send Reset Link
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
                We sent a reset link to{"\n"}
                <Text style={styles.emailText}>{email || "alex@example.com"}</Text>.{"\n"}
                It expires in 15 minutes.
              </Text>
            </View>

            <Button fullWidth onPress={backToSignIn} style={styles.successButton}>
              Back to Sign In
            </Button>

            <Pressable onPress={handleSend}>
              <Text style={styles.resendText}>Didn't receive it? Resend</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
