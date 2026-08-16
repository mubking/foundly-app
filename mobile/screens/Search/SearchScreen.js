import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSearchController, toSavedSearchFilters } from "../../hooks/useSearchController";
import { useSearchSuggestions } from "../../hooks/useSearchSuggestions";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { createSavedSearch } from "../../services/search";
import { optimizeImageUrl, prefetchImage } from "../../utils/cloudinaryImage";

import SearchHeader from "../../components/SearchHeader/SearchHeader";
import ItemCardRow from "../../components/ItemCardRow/ItemCardRow";
import ItemCardGrid from "../../components/ItemCardGrid/ItemCardGrid";
import SearchMapView from "../../components/common/SearchMapView";
import BottomNav from "../../components/BottomNav/BottomNav";
import BottomSheet from "../../components/common/BottomSheet";
import FilterSheetContent from "../../components/common/FilterSheetContent";
import ActiveFiltersBar from "../../components/common/ActiveFiltersBar";
import SkeletonCard from "../../components/common/SkeletonCard";
import StatusState from "../../components/common/StatusState";
import SearchEmptyState from "../../components/common/SearchEmptyState";
import RecentSearchesList from "../../components/common/RecentSearchesList";
import SearchSuggestionsList from "../../components/common/SearchSuggestionsList";

const SKELETON_COUNT = 6;

export default function SearchScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated } = useAuth();

  const [view, setView] = useState("list");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const {
    filters,
    setFilter,
    resetFilters,
    applyFilters,
    activeFilterChips,
    removeFilterChip,
    items,
    meta,
    status,
    errorMessage,
    refreshing,
    isLoadingMore,
    page,
    refresh,
    retry,
    loadMore,
  } = useSearchController();

  const { suggestions } = useSearchSuggestions(isSearchFocused ? filters.q : "");
  const recentSearchesState = useRecentSearches({ enabled: isAuthenticated });

  // Re-running a saved search (SavedSearchesScreen navigates here with its
  // filters) — consumed once, then cleared so navigating back-and-forth
  // doesn't keep re-applying stale params.
  useEffect(() => {
    if (!route.params?.savedFilters) return;
    applyFilters(route.params.savedFilters);
    navigation.setParams({ savedFilters: undefined });
  }, [route.params?.savedFilters, applyFilters, navigation]);

  const goToItem = useCallback(
    (item) => {
      prefetchImage(optimizeImageUrl(item.imageUrl, "detail"));
      navigation.navigate("ItemDetails", { id: item.id });
    },
    [navigation]
  );
  const handleNavigate = (route) => {
    if (route === "Search") return;
    navigation.navigate(route);
  };

  const dismissOverlay = () => setIsSearchFocused(false);
  // A short delay so a tap on a suggestion/recent-search row registers
  // before the blur it also triggers would otherwise hide the row first.
  const handleQueryBlur = () => setTimeout(dismissOverlay, 150);

  const selectQuery = useCallback(
    (value) => {
      setFilter("q", value);
      dismissOverlay();
    },
    [setFilter]
  );
  const selectCategory = useCallback(
    (value) => {
      setFilter("category", value);
      dismissOverlay();
    },
    [setFilter]
  );

  const handleSaveSearch = useCallback(async () => {
    try {
      await createSavedSearch({ filters: toSavedSearchFilters(filters) });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }, [filters]);

  const renderItem = useCallback(
    ({ item }) =>
      view === "grid" ? (
        <ItemCardGrid item={item} onPress={goToItem} style={styles.gridCell} />
      ) : (
        <ItemCardRow item={item} onPress={goToItem} />
      ),
    [view, goToItem, styles.gridCell]
  );

  const showOverlay = isSearchFocused;
  const showSkeleton = !showOverlay && view !== "map" && status === "loading";
  const showEmpty = !showOverlay && view !== "map" && status === "success" && meta.total === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SearchHeader
        onBack={() => navigation.goBack()}
        query={filters.q}
        onQueryChange={(value) => setFilter("q", value)}
        onQueryFocus={() => setIsSearchFocused(true)}
        onQueryBlur={handleQueryBlur}
        onOpenFilters={() => setShowFilterSheet(true)}
        activeFilterCount={activeFilterChips.length}
        onOpenSavedSearches={() => navigation.navigate("SavedSearches")}
        resultsTotal={meta.total}
        view={view}
        onViewChange={setView}
      />

      <ActiveFiltersBar chips={activeFilterChips} onRemove={removeFilterChip} onClearAll={resetFilters} />

      {showOverlay ? (
        <ScrollView style={styles.overlay} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!filters.q.trim() ? (
            <RecentSearchesList
              recentSearches={recentSearchesState.recentSearches}
              onSelect={selectQuery}
              onRemove={recentSearchesState.remove}
              onClearAll={recentSearchesState.clearAll}
              style={styles.overlaySection}
            />
          ) : null}
          <SearchSuggestionsList
            suggestions={suggestions}
            onSelectCategory={selectCategory}
            onSelectQuery={selectQuery}
            style={styles.overlaySection}
          />
        </ScrollView>
      ) : view === "map" ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SearchMapView
            lostCount={items.filter((item) => item.type === "lost").length}
            foundCount={items.filter((item) => item.type === "found").length}
          />
        </ScrollView>
      ) : showSkeleton ? (
        <View style={[styles.listContent, view === "grid" ? styles.skeletonGrid : styles.skeletonList]}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <SkeletonCard key={index} variant={view === "grid" ? "grid" : "row"} style={view === "grid" ? styles.skeletonGridCell : undefined} />
          ))}
        </View>
      ) : status === "error" ? (
        <StatusState message={errorMessage} actionLabel="Retry" onAction={retry} />
      ) : showEmpty ? (
        <SearchEmptyState
          recommendations={meta.recommendations}
          onSelectCategory={selectCategory}
          onSelectCity={(value) => setFilter("city", value)}
          onSelectColor={(value) => setFilter("color", value)}
          onSelectBrand={(value) => setFilter("brand", value)}
        />
      ) : (
        <FlatList
          key={view}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={view === "grid" ? 2 : 1}
          columnWrapperStyle={view === "grid" ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <SkeletonCard variant={view === "grid" ? "grid" : "row"} style={styles.footerSkeleton} />
            ) : items.length > 0 && page >= meta.totalPages ? (
              <StatusState message="You've seen it all" tone="neutral" style={styles.endText} />
            ) : null
          }
        />
      )}

      <BottomNav active="Search" onNavigate={handleNavigate} />

      <BottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)}>
        <FilterSheetContent
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          onApply={() => setShowFilterSheet(false)}
          onSave={isAuthenticated ? handleSaveSearch : null}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  overlay: {
    flex: 1,
  },
  overlaySection: {
    marginTop: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  gridRow: {
    gap: 12,
  },
  gridCell: {
    flex: 1,
  },
  skeletonList: {},
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  skeletonGridCell: {
    width: "47%",
  },
  footerSkeleton: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  endText: {
    flex: 0,
    paddingVertical: 16,
  },
});
