import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

/**
 * Shared keyboard-avoidance wrapper for screens with text inputs — every
 * such screen needs the same iOS/Android `behavior` split, so this
 * centralizes it instead of repeating the Platform check per screen.
 *
 * Android is left with no `behavior` (a no-op wrapper) on purpose: Expo's
 * default `windowSoftInputMode="adjustResize"` already shrinks the root
 * view when the keyboard opens, so pairing that with `behavior="height"`
 * here double-applies the resize. The container shrinks once natively, then
 * again on the next render, so a tap that lands mid-reflow misses whatever
 * input it was aimed at — that's the "first tap doesn't focus, takes 2-4
 * tries" bug. iOS has no native resize, so it still needs `padding` here.
 */
export default function KeyboardAvoidingScreen({ children, style, keyboardVerticalOffset = 0 }) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
