import React, { useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";

/**
 * Shared loading/error/empty presentation, styled to match the inline
 * loading/error blocks already used on Home and Search. Pass `loading` for
 * a spinner, or `message` (+ optional `actionLabel`/`onAction`) for an
 * error or empty state with a single action button ("Retry", "Go Back", …).
 *
 * `tone` defaults to "danger" (every existing call site's red message
 * text, unchanged) — pass "neutral" for a non-error empty state (e.g.
 * Search's "No exact matches."). `children`, when given, renders below the
 * action button — used by Search's empty state for its recommendation chips.
 */
export default function StatusState({ loading, message, actionLabel, onAction, tone = "danger", children, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.center, style]}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text style={[styles.message, tone === "neutral" && styles.messageNeutral]}>{message}</Text>
          {onAction ? (
            <Pressable onPress={onAction} style={styles.actionButton}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
          {children}
        </>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    marginBottom: 12,
  },
  messageNeutral: {
    color: colors.text,
    fontWeight: "600",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
});
