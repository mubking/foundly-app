import React, { useMemo } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import SendIcon from "./SendIcon";

export default function ChatInputBar({ value, onChangeText, onSend, style }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hasText = value.trim().length > 0;

  return (
    <View style={[styles.bar, style]}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type a message…"
          placeholderTextColor={colors.ghost}
          returnKeyType="send"
          onSubmitEditing={hasText ? onSend : undefined}
          style={styles.input}
        />
      </View>

      <Pressable
        style={[styles.sendButton, hasText && styles.sendButtonActive]}
        onPress={onSend}
        disabled={!hasText}
      >
        <SendIcon size={18} color={hasText ? "#fff" : colors.subtle} />
      </Pressable>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
});
