import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { ITEM_CATEGORIES } from "../../constants/itemCategories";

import UploadZone from "./UploadZone";
import ImageThumbnailList from "./ImageThumbnailList";
import AIScannerCard from "./AIScannerCard";
import Input from "../Input/Input";
import CategoryGrid from "./CategoryGrid";

/** Step 1 of Report Lost Item: photos, title, category, description. */
export default function LostDetailsStep({ form }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { imagePicker } = form;

  return (
    <View style={styles.stepGap}>
      <UploadZone onCamera={imagePicker.addFromCamera} onGallery={imagePicker.addFromGallery} />
      <ImageThumbnailList images={imagePicker.images} onRemove={imagePicker.removeImage} />
      {imagePicker.error ? <Text style={styles.errorText}>{imagePicker.error}</Text> : null}

      {form.aiScan ? (
        <AIScannerCard
          status={form.aiScan.status}
          error={form.aiScan.error}
          onScan={form.aiScan.scan}
          detectedTitle={form.title}
          detectedSubtitle={form.category}
        />
      ) : null}

      <Input
        label="Item Title"
        placeholder="e.g. Black leather bifold wallet"
        value={form.title}
        onChangeText={form.setTitle}
        error={form.errors.title}
      />

      <View>
        <Text style={styles.sectionLabel}>Category</Text>
        <CategoryGrid categories={ITEM_CATEGORIES} selected={form.category} onSelect={form.setCategory} />
        {form.errors.category ? <Text style={styles.errorText}>{form.errors.category}</Text> : null}
      </View>

      <Input
        label="Description"
        placeholder="Color, brand, distinguishing features…"
        value={form.description}
        onChangeText={form.setDescription}
        error={form.errors.description}
        multiline
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  stepGap: {
    gap: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
  },
});
