import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import CameraIcon from "./CameraIcon";
import ImageIcon from "./ImageIcon";
import PhotoSourceButton from "./PhotoSourceButton";
import ImageThumbnailList from "./ImageThumbnailList";

/** Step 2 of Claim This Item: an optional single proof-of-ownership photo. */
export default function ClaimEvidenceStep({ form }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { imagePicker } = form;

  return (
    <View style={styles.stepGap}>
      <View>
        <Text style={styles.sectionTitle}>Upload Evidence (Optional)</Text>
        <Text style={styles.sectionBody}>
          A photo proving ownership — a receipt, a previous photo, a serial number — helps the poster verify your
          claim faster.
        </Text>
      </View>

      <View style={styles.photoRow}>
        <PhotoSourceButton
          icon={<CameraIcon size={24} color="#fff" />}
          label="Take Photo"
          variant="gradient"
          onPress={imagePicker.addFromCamera}
        />
        <PhotoSourceButton
          icon={<ImageIcon size={24} color={colors.textLight} />}
          label="From Gallery"
          variant="dashed"
          onPress={imagePicker.addFromGallery}
        />
      </View>

      <ImageThumbnailList images={imagePicker.images} onRemove={imagePicker.removeImage} />
      {imagePicker.error ? <Text style={styles.errorText}>{imagePicker.error}</Text> : null}
      {form.submitError ? <Text style={styles.errorText}>{form.submitError}</Text> : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  stepGap: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
  },
});
