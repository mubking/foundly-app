import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import CheckCircleIcon from "./CheckCircleIcon";

/** Step 3 of Claim This Item: submission confirmation. */
export default function ClaimSuccessStep({ hasProof }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <CheckCircleIcon size={48} color={colors.success} strokeWidth={2} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>Claim Submitted</Text>
        <Text style={styles.body}>
          Your claim has been sent to the poster. They'll review your message{hasProof ? " and photo" : ""} and
          respond soon.
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 20,
    paddingVertical: 32,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenTint,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
  textWrap: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 22,
    textAlign: "center",
  },
});
