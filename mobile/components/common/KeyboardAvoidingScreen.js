import React from "react";
import { StyleSheet } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

/**
 * Shared keyboard-avoidance wrapper for screens with text inputs.
 *
 * Uses react-native-keyboard-controller's KeyboardAvoidingView instead of
 * React Native core's — core's Android implementation is broken under
 * edge-to-edge (this app has `edgeToEdgeEnabled: true`, mandatory since
 * Expo SDK 54/Android 15): the keyboard opens and covers the input instead
 * of pushing it into view. Fixed upstream in React Native 0.86
 * (facebook/react-native#49759, facebook/react-native#55855) but this app
 * is on 0.81, so this library — the fix recommended by RN's own
 * maintainers in that issue thread — stands in until an RN upgrade.
 * `behavior="padding"` matches this component's previous iOS-only
 * behavior, now applied consistently on Android too.
 */
export default function KeyboardAvoidingScreen({
  children,
  style,
  behavior = "padding",
  keyboardVerticalOffset = 0,
}) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
