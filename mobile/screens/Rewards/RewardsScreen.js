import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";

import Header from "../../components/Header/Header";
import IconBadge from "../../components/common/IconBadge";
import GiftIcon from "../../components/common/GiftIcon";

// There is no reward-transaction ledger on the backend — LostItem only has
// a `reward` amount an owner offers, not a wallet/balance/history of paid
// rewards. Rather than fabricate a balance and transaction list, this shows
// an honest "coming soon" state until that ledger exists server-side.
export default function RewardsScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Reward History" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <IconBadge size={72} radius={24} backgroundColor={colors.amberTint}>
          <GiftIcon size={32} color={colors.secondary} />
        </IconBadge>
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.body}>
          Reward tracking isn't available yet. Once it is, paid and earned rewards will show up here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 21,
  },
});
