import React, { useRef, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useProfile } from "../../hooks/useProfile";
import { useImagePicker } from "../../hooks/useImagePicker";
import { useAbortOnUnmount } from "../../hooks/useAbortOnUnmount";
import { uploadImages } from "../../services/upload";
import { getInitials } from "../../utils/initials";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import Avatar from "../../components/Avatar/Avatar";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Edit3Icon from "../../components/common/Edit3Icon";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

// Mirrors validations/user.validation.js's updateProfileSchema — first/last
// name min 2 chars, phone min 10 — so the form fails fast instead of
// waiting on a round trip for a rule the backend already enforces.
function validate({ firstName, lastName, phone }) {
  const errors = {};
  if (firstName.trim().length < 2) errors.firstName = "First name must be at least 2 characters.";
  if (lastName.trim().length < 2) errors.lastName = "Last name must be at least 2 characters.";
  if (phone.trim() && phone.trim().length < 10) errors.phone = "Phone number must be at least 10 characters.";
  return errors;
}

export default function EditProfileScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { profile, loading, error, updateProfile, refresh } = useProfile();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header title="Edit Profile" onBack={() => navigation.goBack()} />

      {loading ? (
        <StatusState loading />
      ) : !profile ? (
        <StatusState
          message={error || "Couldn't load your profile."}
          actionLabel="Retry"
          onAction={refresh}
        />
      ) : (
        <EditProfileForm profile={profile} updateProfile={updateProfile} onSaved={() => navigation.goBack()} />
      )}
    </SafeAreaView>
  );
}

/**
 * Split out from EditProfileScreen so the form's hooks (field state, the
 * image picker) can run unconditionally once `profile` is guaranteed to be
 * loaded — hooks can't run conditionally after the loading/error branch above.
 */
function EditProfileForm({ profile, updateProfile, onSaved }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Same submittingRef pattern as hooks/useReportLostForm.js.
  const submittingRef = useRef(false);

  const lastNameRef = useRef(null);
  const phoneRef = useRef(null);

  const imagePicker = useImagePicker({ max: 1 });
  const pickedAvatar = imagePicker.images[0];
  const abortController = useAbortOnUnmount();

  const handleSave = async () => {
    // Belt-and-suspenders alongside the Button's `disabled` prop — see LoginScreen.
    if (submittingRef.current) return;

    const fieldErrors = validate({ firstName, lastName, phone });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    // Only send fields that actually changed.
    const changes = {};
    if (firstName.trim() !== profile.firstName) changes.firstName = firstName.trim();
    if (lastName.trim() !== profile.lastName) changes.lastName = lastName.trim();
    if (phone.trim() && phone.trim() !== (profile.phone || "")) changes.phone = phone.trim();

    submittingRef.current = true;
    setFormError("");
    setUploadProgress(0);
    setSubmitting(true);
    try {
      if (pickedAvatar) {
        const [avatarUrl] = await uploadImages([pickedAvatar], "profiles", {
          signal: abortController.signal,
          onProgress: setUploadProgress,
        });
        changes.avatar = avatarUrl;
      }

      if (Object.keys(changes).length === 0) {
        onSaved();
        return;
      }

      const result = await updateProfile(changes);
      if (result.ok) {
        onSaved();
      } else {
        setFormError(result.message);
      }
    } catch (err) {
      setFormError(err.message || "Couldn't upload your photo. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Avatar
            size={88}
            initials={getInitials(profile)}
            source={pickedAvatar ? { uri: pickedAvatar.uri } : profile.avatar}
            ring
          />
          <Pressable
            style={styles.editBadge}
            onPress={imagePicker.addFromGallery}
            disabled={imagePicker.isPicking}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <Edit3Icon size={14} color="#fff" />
          </Pressable>
        </View>
        {imagePicker.error ? <Text style={styles.fieldError}>{imagePicker.error}</Text> : null}

        <View style={styles.form}>
          <Input
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
          <Input
            ref={lastNameRef}
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
          />
          <Input
            ref={phoneRef}
            label="Phone"
            placeholder="Add a phone number"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{profile.email}</Text>
            <Text style={styles.readOnlyHint}>Email can't be changed here.</Text>
          </View>

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Button fullWidth disabled={submitting} onPress={handleSave} style={styles.saveButton}>
            {submitting
              ? uploadProgress > 0
                ? `Saving... ${uploadProgress}%`
                : "Saving..."
              : "Save Changes"}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
  },
  fieldError: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    marginBottom: 8,
  },
  form: {
    gap: 16,
    marginTop: 16,
  },
  readOnlyField: {
    gap: 6,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  readOnlyValue: {
    fontSize: 14,
    color: colors.subtle,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  readOnlyHint: {
    fontSize: 12,
    color: colors.textLight,
  },
  formError: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
  saveButton: {
    marginTop: 4,
  },
});
