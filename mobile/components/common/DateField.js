import React, { useState } from "react";
import { Platform, Pressable, View, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import Input from "../Input/Input";
import Button from "../Button/Button";
import BottomSheet from "./BottomSheet";

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// `value` is whatever the last formatDate() produced (or "" before any pick)
// — `new Date(value)` round-trips that fine, same format Date.parse already
// handles at submit time in useReportLostForm/useReportFoundForm.
function parseDate(value) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Date-only field styled exactly like `Input`, but backed by the native
 * date picker instead of the keyboard — replaces free-typed "Jul 28, 2025"
 * strings (error-prone, inconsistent format) with a real calendar. Keeps
 * `Input`'s `value`/`onChangeText` string contract, so the hooks that parse
 * that string via `Date.parse` at submit time don't need to change.
 *
 * Android's picker is its own native dialog (self-dismissing on pick, no
 * wrapper needed). iOS has no such dialog — an inline calendar is presented
 * in the app's existing BottomSheet, with a Done button to commit, since an
 * iOS inline picker has no single-tap "this is final" moment of its own.
 */
export default function DateField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  style,
  editable = true,
  hint,
  error,
  maximumDate,
}) {
  const [visible, setVisible] = useState(false);
  // iOS only: the in-progress selection while the sheet is open, committed
  // on Done rather than on every scroll tick.
  const [pendingDate, setPendingDate] = useState(null);

  const open = () => {
    if (!editable) return;
    setPendingDate(parseDate(value));
    setVisible(true);
  };

  const commit = (date) => {
    onChangeText(formatDate(date));
    setVisible(false);
  };

  const handleAndroidChange = (event, selectedDate) => {
    setVisible(false);
    if (event.type === "set" && selectedDate) commit(selectedDate);
  };

  return (
    <>
      <Pressable onPress={open} disabled={!editable} accessibilityRole="button" accessibilityLabel={label}>
        <View pointerEvents="none">
          <Input
            label={label}
            placeholder={placeholder}
            value={value}
            icon={icon}
            style={style}
            editable={editable}
            hint={hint}
            error={error}
          />
        </View>
      </Pressable>

      {visible && Platform.OS === "android" ? (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          maximumDate={maximumDate}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <BottomSheet visible={visible} onClose={() => setVisible(false)}>
          <DateTimePicker
            value={pendingDate || parseDate(value)}
            mode="date"
            display="inline"
            onChange={(_event, selectedDate) => selectedDate && setPendingDate(selectedDate)}
            maximumDate={maximumDate}
          />
          <Button fullWidth onPress={() => commit(pendingDate || parseDate(value))} style={styles.doneButton}>
            Done
          </Button>
        </BottomSheet>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  doneButton: {
    marginTop: 8,
  },
});
