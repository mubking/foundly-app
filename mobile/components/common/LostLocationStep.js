import React from "react";
import { View, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

import LocationMapPreview from "./LocationMapPreview";
import Input from "../Input/Input";
import DateField from "./DateField";
import CalendarIcon from "./CalendarIcon";
import ClockIcon from "./ClockIcon";
import MapPinIcon from "./MapPinIcon";

/** Step 2 of Report Lost Item: last-seen location and context. */
export default function LostLocationStep({ form }) {
  const colors = useTheme();
  return (
    <View style={styles.stepGap}>
      <LocationMapPreview label="Pin Last Location" />

      <Input
        label="Last Seen Location"
        placeholder="Central Park, near the fountain"
        value={form.location}
        onChangeText={form.setLocation}
        icon={<MapPinIcon size={17} color={colors.textLight} />}
        error={form.errors.location}
      />

      <View style={styles.row}>
        <DateField
          label="Date Lost"
          placeholder="Jul 28, 2025"
          value={form.dateLost}
          onChangeText={form.setDateLost}
          icon={<CalendarIcon size={17} color={colors.textLight} />}
          style={styles.rowItem}
          editable={!form.isEditing}
          hint={form.isEditing ? "Not editable" : undefined}
          maximumDate={new Date()}
        />
        <Input
          label="Time (approx)"
          placeholder="3:00 PM"
          value={form.timeLost}
          onChangeText={form.setTimeLost}
          icon={<ClockIcon size={17} color={colors.textLight} />}
          style={styles.rowItem}
        />
      </View>

      <Input
        label="Additional Context"
        placeholder="Any circumstances, landmarks, or witnesses…"
        value={form.additionalContext}
        onChangeText={form.setAdditionalContext}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepGap: {
    gap: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
});
