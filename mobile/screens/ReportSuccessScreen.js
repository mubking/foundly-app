import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../context/ThemeContext";
import CheckCircleIcon from "../components/common/CheckCircleIcon";
import Button from "../components/Button/Button";

/**
 * Shown after a Lost or Found item report is successfully created. The
 * ReportLost / UploadFound form hooks replace their own screen with this
 * route (see useReportLostForm.js / useReportFoundForm.js), so the form's
 * state is unmounted before the user ever lands here — back navigation can't
 * return to a stale, filled-in form.
 *
 * "View Report" opens the just-created listing on ItemDetails (fetched by id);
 * "Back to Home" returns to the existing Home route, which refreshes its feed
 * on focus.
 */
export default function ReportSuccessScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { reportType, itemId } = useRoute().params || {};

  const isFoundReport = reportType === "found";

  const handleViewReport = () => {
    navigation.navigate("ItemDetails", { id: itemId });
  };

  const handleBackToHome = () => {
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <CheckCircleIcon size={56} color={colors.success} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Report Published!</Text>
        <Text style={styles.body}>
          {isFoundReport
            ? "Your found item report has been successfully posted on Reunio."
            : "Your lost item report has been successfully posted on Reunio."}
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <Button fullWidth disabled={!itemId} onPress={handleViewReport}>
          View Report
        </Button>
        <Button fullWidth variant="outline" onPress={handleBackToHome}>
          Back to Home
        </Button>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenTint,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textLight,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
});
