import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { ITEMS } from "../../constants/homeMockData";

import ArrowLeftIcon from "../../components/common/ArrowLeftIcon";
import FilterIcon from "../../components/common/FilterIcon";
import BarChartIcon from "../../components/common/BarChartIcon";
import GridIcon from "../../components/common/GridIcon";
import MapIcon from "../../components/common/MapIcon";
import SearchInput from "../../components/common/SearchInput";
import FilterChips from "../../components/common/FilterChips";
import ViewToggle from "../../components/common/ViewToggle";
import ItemCardRow from "../../components/ItemCardRow/ItemCardRow";
import ItemCardGrid from "../../components/ItemCardGrid/ItemCardGrid";
import SearchMapView from "../../components/common/SearchMapView";
import BottomNav from "../../components/BottomNav/BottomNav";

const TYPE_FILTERS = [
  { label: "All", value: "All" },
  { label: "Lost", value: "Lost" },
  { label: "Found", value: "Found" },
  { label: "With Reward", value: "WithReward" },
  { label: "Verified", value: "Verified" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "Newest" },
  { label: "Nearest", value: "Nearest" },
  { label: "Reward $$$", value: "Reward" },
];

const VIEW_OPTIONS = [
  { value: "list", icon: BarChartIcon },
  { value: "grid", icon: GridIcon },
  { value: "map", icon: MapIcon },
];

const RESULTS = [...ITEMS, ...ITEMS.slice(0, 2)];

export default function SearchScreen() {
  const navigation = useNavigation();
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [typeFilter, setTypeFilter] = useState("All");

  const goToItem = () => navigation.navigate("ItemDetails");
  const handleNavigate = (route) => {
    if (route === "Search") return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon size={20} color={colors.text} />
          </Pressable>

          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search items, locations…"
            autoFocus
          />

          <Pressable
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <FilterIcon size={18} color={showFilters ? "#fff" : colors.ink2} />
          </Pressable>
        </View>

        {showFilters ? (
          <View style={styles.filtersPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeFiltersRow}>
              <FilterChips options={TYPE_FILTERS} active={typeFilter} onChange={setTypeFilter} />
            </ScrollView>

            <FilterChips
              options={SORT_OPTIONS}
              active={sortBy}
              onChange={setSortBy}
              variant="soft"
              equalWidth
            />
          </View>
        ) : null}

        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            <Text style={styles.resultsCount}>48</Text> results{query ? ` for "${query}"` : " near you"}
          </Text>
          <ViewToggle options={VIEW_OPTIONS} active={view} onChange={setView} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {view === "list" ? (
          <View style={styles.listWrap}>
            {RESULTS.map((item, index) => (
              <ItemCardRow key={`${item.id}-${index}`} item={item} onPress={goToItem} />
            ))}
          </View>
        ) : null}

        {view === "grid" ? (
          <View style={styles.gridWrap}>
            {RESULTS.map((item, index) => (
              <ItemCardGrid key={`${item.id}-${index}`} item={item} onPress={goToItem} style={styles.gridCell} />
            ))}
          </View>
        ) : null}

        {view === "map" ? <SearchMapView lostCount={21} foundCount={27} onPinPress={goToItem} /> : null}
      </ScrollView>

      <BottomNav active="Search" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filtersPanel: {
    gap: 10,
  },
  typeFiltersRow: {
    paddingRight: 8,
  },
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
  },
  resultsCount: {
    color: colors.text,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  listWrap: {
    gap: 10,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCell: {
    width: "47%",
  },
});
