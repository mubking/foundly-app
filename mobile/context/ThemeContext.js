import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import lightColors from "../constants/colors";
import darkColors from "../constants/darkColors";

const ThemeContext = createContext(undefined);

// A UI preference, not a credential — plain AsyncStorage, unlike the JWT in
// utils/token.js, which uses SecureStore for exactly that distinction.
const STORAGE_KEY = "foundly_theme_preference";

/**
 * App-wide theme. Preference is one of "light" | "dark" | "system",
 * persisted to AsyncStorage and restored on launch. "system" tracks the
 * device's current appearance live via `Appearance.addChangeListener` — no
 * restart needed if the OS theme changes while the app is open.
 *
 * Mounted once in AppNavigator, wrapping the whole tree, so every screen
 * re-renders with the new palette the instant the preference (or the OS
 * theme, under "system") changes.
 */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState("system");
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme() || "light");

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isMounted && (stored === "light" || stored === "dark" || stored === "system")) {
          setPreference(stored);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || "light");
    });
    return () => subscription.remove();
  }, []);

  const setThemePreference = useCallback((next) => {
    setPreference(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const mode = preference === "system" ? systemScheme : preference;
  const colors = mode === "dark" ? darkColors : lightColors;

  const value = useMemo(
    () => ({ colors, mode, preference, setThemePreference }),
    [colors, mode, preference, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("Must be used within a ThemeProvider");
  }
  return ctx;
}

/**
 * The active palette, keyed identically to constants/colors.js — drop-in
 * replacement for every former `import colors from ".../constants/colors"`:
 * `const colors = useTheme();`.
 * @returns {typeof import("../constants/colors").default}
 */
export function useTheme() {
  return useThemeContext().colors;
}

/**
 * Full theme control — resolved `mode` ("light"|"dark"), the raw
 * `preference` ("light"|"dark"|"system"), and `setThemePreference`. Only
 * Settings needs this; everywhere else just needs {@link useTheme}.
 * @returns {{mode: "light"|"dark", preference: "light"|"dark"|"system", setThemePreference: (next: "light"|"dark"|"system") => void}}
 */
export function useThemePreference() {
  const { mode, preference, setThemePreference } = useThemeContext();
  return { mode, preference, setThemePreference };
}
