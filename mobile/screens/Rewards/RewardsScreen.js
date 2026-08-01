import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { BALANCE_SUMMARY, TRANSACTIONS } from "../../constants/rewardHistoryMockData";

import Header from "../../components/Header/Header";
import BalanceCard from "../../components/common/BalanceCard";
import TransactionRow from "../../components/common/TransactionRow";

export default function RewardsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Reward History" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BalanceCard
          totalEarned={BALANCE_SUMMARY.totalEarned}
          subtitle={BALANCE_SUMMARY.subtitle}
          breakdown={BALANCE_SUMMARY.breakdown}
          style={styles.balanceCard}
        />

        <Text style={styles.sectionLabel}>Transaction History</Text>

        <View style={styles.list}>
          {TRANSACTIONS.map((txn, index) => (
            <TransactionRow
              key={index}
              type={txn.type}
              title={txn.title}
              subtitle={`${txn.from ? `from ${txn.from}` : `for ${txn.for}`} · ${txn.date}`}
              amount={txn.amount}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  balanceCard: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
});
