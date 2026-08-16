import React, { useMemo } from "react";
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useSavedSearches } from "../../hooks/useSavedSearches";

import Header from "../../components/Header/Header";
import Card from "../../components/common/Card";
import StatusState from "../../components/common/StatusState";
import BookmarkIcon from "../../components/common/BookmarkIcon";
import Trash2Icon from "../../components/common/Trash2Icon";

/** "iPhone in Lagos" style one-line summary of a saved search's criteria. */
function describeFilters(filters) {
  const parts = [
    filters.type && filters.type !== "all" ? (filters.type === "lost" ? "Lost" : "Found") : null,
    filters.category,
    filters.brand,
    filters.color,
    filters.city,
    filters.hasReward ? "Reward" : null,
    filters.verifiedOnly ? "Verified" : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All items";
}

export default function SavedSearchesScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { savedSearches, status, errorMessage, refreshing, load, remove } = useSavedSearches();

  const runSearch = (savedSearch) => navigation.navigate("Search", { savedFilters: savedSearch.filters });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Saved Searches" onBack={() => navigation.goBack()} />

      {status === "loading" ? (
        <StatusState loading />
      ) : status === "error" ? (
        <StatusState message={errorMessage} actionLabel="Retry" onAction={() => load()} />
      ) : (
        <FlatList
          data={savedSearches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ isRefresh: true })} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <Card onPress={() => runSearch(item)} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconBadge}>
                  <BookmarkIcon size={18} color={colors.primary} />
                </View>

                <View style={styles.textWrap}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.summary} numberOfLines={1}>
                    {describeFilters(item.filters)}
                  </Text>
                </View>

                <Pressable onPress={() => remove(item.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete saved search">
                  <Trash2Icon size={18} color={colors.danger} />
                </Pressable>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No saved searches yet. Open Search, set up your filters, and tap "Save this search".
            </Text>
          }
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
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryTint,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  summary: {
    fontSize: 12,
    color: colors.subtle,
    marginTop: 1,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
});
