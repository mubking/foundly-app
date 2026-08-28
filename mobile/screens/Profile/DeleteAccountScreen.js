import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { deleteAccount } from "../../services/users";

import Header from "../../components/Header/Header";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import IconBadge from "../../components/common/IconBadge";
import Trash2Icon from "../../components/common/Trash2Icon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

const CONSEQUENCES = [
  "Your account will be deactivated and you won't be able to sign back in.",
  "Your profile, lost/found reports, claims, and conversations will no longer be visible to other users.",
  "Your account data is retained by Foundly (it is not deleted). This can't be undone from inside the app.",
];

// Settings > Danger Zone > Delete Account. Requires the current password
// to confirm (social-only accounts have none — the backend skips that
// check for them, see services/users.js#deleteAccount). On success the
// session is exactly as invalid as a banned/suspended one, so this reuses
// `logout()` to clear it locally and resets the stack to Login, same as
// useLogout.
export default function DeleteAccountScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Deactivate your account?",
      "This deactivates your Reunio account and hides your activity from other users. Your data is retained and this can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate Account", style: "destructive", onPress: confirmDelete },
      ]
    );
  };

  const confirmDelete = async () => {
    if (submitting) return;
    setFormError("");
    setSubmitting(true);
    try {
      await deleteAccount(password || undefined);
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
          contentContainerStyle={styles.content}
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

          <View style={styles.form}>
            <Input
              label="Confirm Your Password"
              placeholder="Leave blank if you use Google or Apple sign-in"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleDelete}
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Button
              fullWidth
              variant="red"
              disabled={submitting}
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              {submitting ? "Deactivating account..." : "Deactivate Account"}
            </Button>

            <Button fullWidth variant="surface" disabled={submitting} onPress={() => navigation.goBack()}>
              Cancel
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
  deleteButton: {
    marginTop: 4,
  },
});
