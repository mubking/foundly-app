import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { CURRENT_USER, ITEMS, CATEGORIES, COMMUNITY_IMPACT, QUICK_STATS } from "../../constants/homeMockData";

import Avatar from "../../components/Avatar/Avatar";
import BellIcon from "../../components/common/BellIcon";
import SearchBar from "../../components/SearchBar/SearchBar";
import HeroSection from "../../components/HeroSection/HeroSection";
import MatchAlertBanner from "../../components/common/MatchAlertBanner";
import SectionTitle from "../../components/common/SectionTitle";
import CategoryCard from "../../components/CategoryCard/CategoryCard";
import ItemCardFeatured from "../../components/ItemCardFeatured/ItemCardFeatured";
import ItemCardRow from "../../components/ItemCardRow/ItemCardRow";
import FilterChips from "../../components/common/FilterChips";
import Card from "../../components/common/Card";
import MapIcon from "../../components/common/MapIcon";
import BottomNav from "../../components/BottomNav/BottomNav";

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Lost", value: "lost" },
  { label: "Found", value: "found" },
];

const STAT_COLORS = {
  success: colors.success,
  primary: colors.primary,
  secondary: colors.secondary,
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState("all");

  const filteredItems = ITEMS.filter((item) => filter === "all" || item.type === filter);

  const handleNavigate = (route) => {
    if (route === "Home") return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning ☀️</Text>
          <Text style={styles.name}>{CURRENT_USER.name}</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.bellButton} onPress={() => navigation.navigate("Notifications")}>
            <BellIcon size={19} color={colors.ink2} />
            <View style={styles.bellDot} />
          </Pressable>
          <Avatar size={40} initials={CURRENT_USER.initials} source={CURRENT_USER.avatar} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SearchBar
          placeholder="Search items by name or location…"
          onPress={() => navigation.navigate("Search")}
          style={styles.section}
        />

        <HeroSection
          itemsReturned={COMMUNITY_IMPACT.itemsReturned}
          trend={COMMUNITY_IMPACT.trend}
          onReportLost={() => navigation.navigate("ReportLost")}
          onUploadFound={() => navigation.navigate("UploadFound")}
          style={styles.section}
        />

        <MatchAlertBanner
          title="Possible match found!"
          subtitle="Your lost wallet may be in Times Square"
          onPress={() => navigation.navigate("Notifications")}
          style={styles.section}
        />

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>Categories</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.label}
                emoji={cat.emoji}
                label={cat.label}
                count={cat.count}
                onPress={() => navigation.navigate("Search")}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionTitle
            style={styles.sectionTitle}
            action={
              <Pressable style={styles.mapLink} onPress={() => navigation.navigate("Search")}>
                <Text style={styles.mapLinkText}>Map</Text>
                <MapIcon size={13} color={colors.primary} />
              </Pressable>
            }
          >
            Nearby Items
          </SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {ITEMS.map((item) => (
              <ItemCardFeatured key={item.id} item={item} onPress={() => navigation.navigate("ItemDetails")} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>Recent Reports</SectionTitle>
          <FilterChips options={FILTER_OPTIONS} active={filter} onChange={setFilter} style={styles.filterChips} />
          <View style={styles.itemList}>
            {filteredItems.map((item) => (
              <ItemCardRow key={item.id} item={item} onPress={() => navigation.navigate("ItemDetails")} />
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.statsRow]}>
          {QUICK_STATS.map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: STAT_COLORS[stat.color] }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statTrend, { color: STAT_COLORS[stat.color] }]}>{stat.trend}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="Home" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  bellDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: "#fff",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  hScroll: {
    gap: 12,
    paddingRight: 24,
  },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mapLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  filterChips: {
    marginBottom: 16,
  },
  itemList: {
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textLight,
    marginTop: 2,
  },
  statTrend: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    opacity: 0.8,
  },
});
