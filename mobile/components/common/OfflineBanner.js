import React, { useMemo } from "react";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useSocketConnectionState } from "../../hooks/useSocketConnectionState";
import WifiOffIcon from "./WifiOffIcon";

/**
 * Mounted once at the app root (see AppNavigator.js), same placement as
 * NotificationToastHost — a slim, non-blocking pill shown above whatever
 * screen is on top whenever the device has no connection, or (while
 * otherwise online) the realtime socket has dropped and is trying to
 * reconnect — e.g. a server restart/deploy, or a brief network blip that
 * NetInfo itself doesn't flag as "offline". Doesn't queue actions or block
 * interaction; the existing per-request timeout/retry handling
 * (services/api.js) and services/socket.js's own auto-reconnect already
 * cover the actual recovery — this is purely an honest, ambient status
 * indicator. Device-offline takes priority when both are true, since it's
 * the more actionable/understandable message for the user.
 */
export default function OfflineBanner() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isConnected } = useNetworkStatus();
  const { isAuthenticated } = useAuth();
  const socketState = useSocketConnectionState();

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]} pointerEvents="none">
        <View style={styles.pill}>
          <WifiOffIcon size={14} color={colors.danger} />
          <Text style={styles.text}>You're offline</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Only while a session is actually meant to have a socket open — before
  // login, or right after logout, "reconnecting" isn't a meaningful state
  // to show. "connecting" (the very first handshake after login) is
  // deliberately excluded too — this is about a *lost* connection coming
  // back, not the normal brief moment every session starts in.
  if (isAuthenticated && socketState === "reconnecting") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]} pointerEvents="none">
        <View style={[styles.pill, styles.pillReconnecting]}>
          <ActivityIndicator size="small" color={colors.secondary} />
          <Text style={[styles.text, styles.textReconnecting]}>Reconnecting…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return null;
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
  pillReconnecting: {
    backgroundColor: colors.amberTint,
    borderColor: `${colors.secondary}33`,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
  },
  textReconnecting: {
    color: colors.secondary,
  },
});
