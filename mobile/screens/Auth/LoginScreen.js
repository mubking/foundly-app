import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import colors from "../../constants/colors";
import Header from "../../components/Header/Header";
import BrandMark from "../../components/common/BrandMark";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Divider from "../../components/common/Divider";
import SocialButton from "../../components/common/SocialButton";
import MailIcon from "../../components/common/MailIcon";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandMark style={styles.brand} />

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your Foundly account.</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="alex@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<MailIcon size={17} color={colors.textLight} />}
          />

          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Button fullWidth onPress={() => navigation.navigate("Home")} style={styles.signInButton}>
            Sign In
          </Button>

          <Divider label="or" />

          <View style={styles.socialRow}>
            <SocialButton
              variant="light"
              icon={<FontAwesome name="google" size={16} color={colors.text} />}
              label="Google"
            />
            <SocialButton
              variant="dark"
              icon={<FontAwesome name="apple" size={18} color="#fff" />}
              label="Apple"
            />
          </View>

          <Text style={styles.footerText}>
            No account?{" "}
            <Text style={styles.footerLink} onPress={() => navigation.navigate("Signup")}>
              Sign up free
            </Text>
          </Text>
        </View>
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


