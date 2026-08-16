import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { ITEM_CATEGORIES } from "../../constants/itemCategories";

import PhotoSourceButton from "./PhotoSourceButton";
import CameraIcon from "./CameraIcon";
import ImageIcon from "./ImageIcon";
import ImageThumbnailList from "./ImageThumbnailList";
import Input from "../Input/Input";
import DateField from "./DateField";
import CategoryGrid from "./CategoryGrid";
import MapPinIcon from "./MapPinIcon";
import CalendarIcon from "./CalendarIcon";
import PackageIcon from "./PackageIcon";

/**
 * Shared field set for reporting AND editing a Found item: photos, title,
 * category, location, date/storage, description. Extracted out of
 * ReportFoundScreen so EditFoundItemScreen can reuse it without duplicating
 * the same ~80 lines of form JSX — mirrors how the Lost flow already splits
 * its fields into step components.
 *
 * `children` renders between the photo picker and the title input — that's
 * where ReportFoundScreen slots in its create-only AIScannerCard; edit has
 * nothing to put there.
 */
export default function FoundItemFields({ form, titlePlaceholder = "What did you find?", children }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { imagePicker } = form;

  return (
    <>
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

      {children}

      <Input
        label="Item Title"
        placeholder={titlePlaceholder}
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
        label="Found at Location"
        placeholder="Where exactly did you find it?"
        value={form.location}
        onChangeText={form.setLocation}
        icon={<MapPinIcon size={17} color={colors.textLight} />}
        error={form.errors.location}
      />

      <View style={styles.row}>
        <DateField
          label="Date Found"
          placeholder="Jul 28, 2025"
          value={form.dateFound}
          onChangeText={form.setDateFound}
          icon={<CalendarIcon size={17} color={colors.textLight} />}
          style={styles.rowItem}
          editable={!form.isEditing}
          hint={form.isEditing ? "Not editable" : undefined}
          maximumDate={new Date()}
        />
        <Input
          label="Storage Location"
          placeholder="e.g. Police station"
          value={form.storageLocation}
          onChangeText={form.setStorageLocation}
          icon={<PackageIcon size={17} color={colors.textLight} />}
          style={styles.rowItem}
        />
      </View>

      <Input
        label="Description"
        placeholder="Describe any unique identifying marks…"
        value={form.description}
        onChangeText={form.setDescription}
        error={form.errors.description}
        multiline
      />
    </>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    marginTop: 8,
  },
});
