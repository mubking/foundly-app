import React, { useMemo } from "react";
import { Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import BottomSheet from "./BottomSheet";
import MenuRow from "./MenuRow";
import FlagIcon from "./FlagIcon";

// Exactly the `reason` enum POST /api/reports validates against
// (backend/src/validations/report.validation.js) — not a client-invented list.
const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fraud", label: "Fraud or scam" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

/**
 * Reason picker for `POST /api/reports`. Selecting a reason submits
 * immediately — there's no free-text description step here, since the
 * backend's `description` field is optional and the common case doesn't
 * need it.
 */
export default function ReportReasonSheet({ visible, onClose, onSelectReason, submitting }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Why are you reporting this listing?</Text>

      {REASONS.map((reason) => (
        <MenuRow
          key={reason.value}
          icon={<FlagIcon size={16} color={colors.subtle} />}
          iconColor={colors.subtle}
          label={reason.label}
          showChevron={false}
          onPress={submitting ? undefined : () => onSelectReason(reason.value)}
          style={submitting ? styles.disabledRow : undefined}
        />
      ))}
    </BottomSheet>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  disabledRow: {
    opacity: 0.6,
  },
});
