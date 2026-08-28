import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import RootNavigator from "./RootNavigator";
import { navigationRef } from "./navigationRef";
import { AuthProvider } from "../context/AuthContext";
import { NotificationsProvider } from "../context/NotificationsContext";
import { ThemeProvider, useThemePreference } from "../context/ThemeContext";
import NotificationToastHost from "../components/common/NotificationToastHost";
import PushNotificationHost from "../components/common/PushNotificationHost";
import OfflineBanner from "../components/common/OfflineBanner";

export default function AppNavigator() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Maps `foundly://reset-password?email=...&code=...` (the password-reset
// email's "Open Foundly App" button — see backend/src/lib/mailer.js) to the
// ResetPassword screen. Extra query params (`email`, `code`) are passed
// through to `route.params` automatically by React Navigation, no explicit
// param mapping needed. Every other screen is left unmapped, so it's only
// reachable in-app via normal navigation, not a guessable deep link.
const linking = {
  prefixes: ["foundly://"],
  config: {
    screens: {
      ResetPassword: "reset-password",
    },
  },
};

/**
 * Split out from AppNavigator so it can read {@link useThemePreference} —
 * that hook needs ThemeProvider above it in the tree, which AppNavigator
 * itself renders rather than being wrapped by.
 */
function NavigationShell() {
  const { mode } = useThemePreference();

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={mode === "dark" ? NavigationDarkTheme : NavigationLightTheme}
      linking={linking}
    >
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <NotificationsProvider>
        <RootNavigator />
      </NotificationsProvider>
      <NotificationToastHost />
      <PushNotificationHost />
      <OfflineBanner />
    </NavigationContainer>
  );
}
