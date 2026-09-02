import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { ITEM_CATEGORIES } from "../../constants/itemCategories";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useMatchAlert } from "../../hooks/useMatchAlert";
import { getRecentItems } from "../../services/items";
import { getGreeting } from "../../utils/time";
import { optimizeImageUrl, prefetchImage } from "../../utils/cloudinaryImage";

import Avatar from "../../components/Avatar/Avatar";
import BellIcon from "../../components/common/BellIcon";
import SearchBar from "../../components/SearchBar/SearchBar";
import HeroSection from "../../components/HeroSection/HeroSection";
import SectionTitle from "../../components/common/SectionTitle";
import CategoryCard from "../../components/CategoryCard/CategoryCard";
import ItemCardFeatured from "../../components/ItemCardFeatured/ItemCardFeatured";
import ItemCardRow from "../../components/ItemCardRow/ItemCardRow";
import FilterChips from "../../components/common/FilterChips";
import MapIcon from "../../components/common/MapIcon";
import MatchAlertBanner from "../../components/common/MatchAlertBanner";
import BottomNav from "../../components/BottomNav/BottomNav";

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Lost", value: "lost" },
  { label: "Found", value: "found" },
];

const ITEMS_LIMIT = 20;

function getDisplayName(user) {
  if (!user) return "";
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

function getInitials(user) {
  if (!user) return "";
  return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
}

export default function HomeScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const matchAlert = useMatchAlert();
  const [greeting, setGreeting] = useState(() => getGreeting());
  const [filter, setFilter] = useState("all");

  const [items, setItems] = useState([]);
  // Total items reported across the whole system (from the search
  // endpoint's `total`, not just this page's `items`) — powers the Hero's
  // "Community Activity" count, the only real number it has to show.
  const [totalItems, setTotalItems] = useState(0);
  // "loading" | "success" | "error" — drives the Nearby Items / Recent
  // Reports sections only; the rest of the screen doesn't depend on items.
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  // Navigation to Item Details starts immediately; the hero image the
  // details screen will render is prefetched alongside it (fire-and-forget)
  // so it's already warm in expo-image's cache by the time that screen
  // mounts, instead of starting a cold download only once the user is there.
  const goToItem = useCallback(
    (item) => {
      prefetchImage(optimizeImageUrl(item.imageUrl, "detail"));
      navigation.navigate("ItemDetails", { id: item.id });
    },
    [navigation]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadItems = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setStatus("loading");
    }
    setErrorMessage("");

    try {
      const result = await getRecentItems({ limit: ITEMS_LIMIT });
      if (!isMountedRef.current) return;
      setItems(result.items);
      setTotalItems(result.total);
      setStatus("success");
    } catch (err) {
      if (!isMountedRef.current) return;
      setErrorMessage(err.message || "Couldn't load items. Please try again.");
      setStatus("error");
    } finally {
      if (isMountedRef.current) setRefreshing(false);
    }
  }, []);

  // Fires on initial mount and every time Home regains focus — including
  // returning from Upload Found Item / Report Lost Item after a successful
  // post — so the feed reflects new posts without a manual pull-to-refresh
  // or app restart. No sockets involved; this is a plain re-fetch.
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  // Recompute greeting on every focus so it never shows a stale/day-night
  // mismatch (e.g. the app left open overnight or the device timezone
  // changed while the app was backgrounded).
  useFocusEffect(
    useCallback(() => {
      setGreeting(getGreeting());
    }, [])
  );

  const handleRefresh = useCallback(() => {
    loadItems({ isRefresh: true });
  }, [loadItems]);

  const filteredItems = items.filter((item) => filter === "all" || item.type === filter);

  const handleNavigate = (route) => {
    if (route === "Home") return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name}>{getDisplayName(user)}</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.bellButton}
            onPress={() => navigation.navigate("Notifications")}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          >
            <BellIcon size={19} color={colors.ink2} />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Avatar
            size={40}
            initials={getInitials(user)}
            source={user?.avatar ? { uri: user.avatar } : null}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <SearchBar
          placeholder="Search items by name or location…"
          onPress={() => navigation.navigate("Search")}
          style={styles.section}
        />

        <HeroSection
          totalItems={totalItems}
          onReportLost={() => navigation.navigate("ReportLost")}
          onUploadFound={() => navigation.navigate("UploadFound")}
          style={styles.section}
        />

        {matchAlert ? (
          <MatchAlertBanner
            title={matchAlert.title}
            subtitle={matchAlert.subtitle}
            onPress={() => navigation.navigate("Matches")}
            style={styles.section}
          />
        ) : null}

        <View style={styles.section}>
          <SectionTitle style={styles.sectionTitle}>Categories</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {ITEM_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.label}
                emoji={cat.emoji}
                label={cat.label}
                onPress={() => navigation.navigate("Search")}
              />
            ))}
          </ScrollView>
        </View>

        {status === "loading" ? (
          <View style={[styles.section, styles.centerBlock]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : status === "error" ? (
          <View style={[styles.section, styles.centerBlock]}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => loadItems()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
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
              {items.length === 0 ? (
                <Text style={styles.emptyText}>No items reported yet.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                  {items.map((item) => (
                    <ItemCardFeatured key={item.id} item={item} onPress={goToItem} />
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle style={styles.sectionTitle}>Recent Reports</SectionTitle>
              <FilterChips options={FILTER_OPTIONS} active={filter} onChange={setFilter} style={styles.filterChips} />
              {filteredItems.length === 0 ? (
                <Text style={styles.emptyText}>
                  {filter === "all" ? "No items reported yet." : `No ${filter} items to show.`}
                </Text>
              ) : (
                <View style={styles.itemList}>
                  {filteredItems.map((item) => (
                    <ItemCardRow key={item.id} item={item} onPress={goToItem} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav active="Home" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: "#fff",
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  scroll: {
    flex: 1,
  },
  centerBlock: {
    alignItems: "center",
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    paddingVertical: 8,
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
});
