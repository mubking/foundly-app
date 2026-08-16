import React, { useMemo, useState } from "react";
import { Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useMatches } from "../../hooks/useMatches";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import FilterChips from "../../components/common/FilterChips";
import MatchCard from "../../components/common/MatchCard";

const SECTIONS = [
  { label: "High Confidence", value: "highConfidence" },
  { label: "Possible", value: "possible" },
  { label: "Dismissed", value: "dismissed" },
];

const EMPTY_TEXT = {
  highConfidence: "No high-confidence matches yet — we'll notify you as soon as we find one.",
  possible: "No possible matches right now.",
  dismissed: "You haven't dismissed any matches.",
};

export default function MatchesScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const [section, setSection] = useState("highConfidence");

  const {
    highConfidence,
    possible,
    dismissed,
    status,
    errorMessage,
    refreshing,
    updatingId,
    updateError,
    load,
    dismissMatch,
    startClaim,
  } = useMatches();

  const groups = { highConfidence, possible, dismissed };
  const data = groups[section];

  const goToItem = (item) => {
    if (!item) return;
    navigation.navigate("ItemDetails", { id: item.id });
  };

  const handleStartClaim = async (match) => {
    const otherItem = match.role === "lost" ? match.foundItem : match.lostItem;
    await startClaim(match.id);
    if (!otherItem) return;
    navigation.navigate("ClaimVerification", {
      itemId: otherItem.id,
      itemType: otherItem.type,
      itemTitle: otherItem.title,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Matches" onBack={() => navigation.goBack()} />

      <FilterChips options={SECTIONS} active={section} onChange={setSection} style={styles.chips} />

      {updateError ? <Text style={styles.updateError}>{updateError}</Text> : null}

      {status === "loading" ? (
        <StatusState loading />
      ) : status === "error" ? (
        <StatusState message={errorMessage} actionLabel="Retry" onAction={() => load()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(match) => match.id}
          renderItem={({ item: match }) => (
            <MatchCard
              match={match}
              isUpdating={updatingId === match.id}
              onViewItem={goToItem}
              onStartClaim={handleStartClaim}
              onDismiss={dismissMatch}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ isRefresh: true })} tintColor={colors.primary} />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>{EMPTY_TEXT[section]}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chips: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  updateError: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 40,
  },
});
