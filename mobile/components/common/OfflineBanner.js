import React, { useMemo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import WifiOffIcon from "./WifiOffIcon";

/**
 * Mounted once at the app root (see AppNavigator.js), same placement as
 * NotificationToastHost — a slim, non-blocking pill shown above whatever
 * screen is on top whenever the device has no connection. Doesn't queue
 * actions or block interaction; the existing per-request timeout/retry
 * handling (services/api.js) already covers what happens when a request
 * fires while offline. This is purely an honest, ambient status indicator.
 */
export default function OfflineBanner() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]} pointerEvents="none">
      <View style={styles.pill}>
        <WifiOffIcon size={14} color={colors.danger} />
        <Text style={styles.text}>You're offline</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    elevation: 99,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.redTint,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
  },
});
