import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import MessageCircleIcon from "./MessageCircleIcon";
import ShieldIcon from "./ShieldIcon";
import Button from "../Button/Button";

/**
 * Item Details' sticky bottom bar (non-owners only): message the poster, or
 * claim the item. The claim button is disabled once the item is no longer
 * claimable (`isClaimable`, derived from `item.status` — see
 * useItemDetailsActions) rather than always being active regardless of
 * real status.
 */
export default function ItemDetailsCta({ isClaimable, claimLabel, onCallPress, onClaimPress, bottomInset }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.stickyCta, { paddingBottom: bottomInset + 16 }]}>
      <Pressable
        style={styles.callButton}
        onPress={onCallPress}
        accessibilityRole="button"
        accessibilityLabel="Message poster"
      >
        <MessageCircleIcon size={19} color={colors.ink2} />
      </Pressable>

      <Button
        size="md"
        fullWidth
        disabled={!isClaimable}
        icon={<ShieldIcon size={18} color="#fff" />}
        onPress={onClaimPress}
        style={styles.claimButton}
      >
        {claimLabel}
      </Button>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  stickyCta: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  claimButton: {
    flex: 1,
  },
});
