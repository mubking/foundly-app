import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
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
import UserIcon from "../../components/common/UserIcon";
import MailIcon from "../../components/common/MailIcon";

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
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

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join 12,000+ people recovering what matters most.</Text>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Alex Johnson"
            value={name}
            onChangeText={setName}
            icon={<UserIcon size={17} color={colors.textLight} />}
          />

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
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            hint="Use letters, numbers, and symbols"
          />

          <Button fullWidth onPress={() => navigation.navigate("Home")} style={styles.createButton}>
            Create Account
          </Button>

          <Divider label="or continue with" />

          <View style={styles.socialRow}>
            <SocialButton
              variant="light"
              icon={<FontAwesome name="google" size={16} color={colors.text} />}
              label="Continue with Google"
            />
            <SocialButton
              variant="dark"
              icon={<FontAwesome name="apple" size={18} color="#fff" />}
              label="Continue with Apple"
            />
          </View>

          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.footerLink} onPress={() => navigation.navigate("Login")}>
              Sign in
            </Text>
          </Text>

          <Text style={styles.legalText}>
            By continuing you agree to our <Text style={styles.legalLink}>Terms</Text> and{" "}
            <Text style={styles.legalLink}>Privacy Policy</Text>
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
    lineHeight: 20,
    marginBottom: 32,
  },
  form: {
    gap: 16,
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
