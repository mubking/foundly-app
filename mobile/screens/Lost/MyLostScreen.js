import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { STATUS_CONFIG } from "../../constants/myLostMockData";
import { getMyLostItems } from "../../services/myItems";
import { useItems } from "../../hooks/useItems";
import { optimizeImageUrl, prefetchImage } from "../../utils/cloudinaryImage";

import Header from "../../components/Header/Header";
import Button from "../../components/Button/Button";
import PlusIcon from "../../components/common/PlusIcon";
import Card from "../../components/common/Card";
import StatusItemRow from "../../components/common/StatusItemRow";
import StatusState from "../../components/common/StatusState";

const PAGE_LIMIT = 50;

export default function MyLostScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { items, status, errorMessage, refreshing, run } = useItems();

  const load = useCallback((options) => run(() => getMyLostItems({ limit: PAGE_LIMIT }), options), [run]);

  useEffect(() => {
    load();
  }, [load]);

  const summaryStats = useMemo(
    () => [
      {
        label: "Active",
        value: items.filter((item) => item.status === "open" || item.status === "matched").length,
        colorKey: "secondary",
      },
      {
        label: "Pending Claim",
        value: items.filter((item) => item.status === "claimed").length,
        colorKey: "primary",
      },
      {
        label: "Returned",
        value: items.filter((item) => item.status === "closed").length,
        colorKey: "success",
      },
    ],
    [items]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
      return (
        <StatusItemRow
          image={item.image}
          title={item.title}
          statusLabel={config.label}
          statusVariant={config.variant}
          reward={item.reward}
          location={item.location}
          timeLabel={item.time}
          onPress={() => {
            prefetchImage(optimizeImageUrl(item.imageUrl, "detail"));
            navigation.navigate("ItemDetails", { id: item.id });
          }}
        />
      );
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="My Lost Items"
        onBack={() => navigation.goBack()}
        right={
          <Button
            variant="primary"
            size="xs"
            icon={<PlusIcon size={14} color="#fff" />}
            onPress={() => navigation.navigate("ReportLost")}
          >
            New
          </Button>
        }
      />

      {status === "loading" ? (
        <StatusState loading />
      ) : status === "error" ? (
        <StatusState message={errorMessage} actionLabel="Retry" onAction={() => load()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ isRefresh: true })} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.summaryRow}>
              {summaryStats.map((stat) => (
                <Card key={stat.label} style={styles.summaryCard}>
                  <Text style={[styles.summaryValue, { color: colors[stat.colorKey] }]}>{stat.value}</Text>
                  <Text style={styles.summaryLabel}>{stat.label}</Text>
                </Card>
              ))}
            </View>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't reported any lost items yet.</Text>}
          ListFooterComponent={
            <>
              <Button
                fullWidth
                icon={<PlusIcon size={18} color="#fff" />}
                onPress={() => navigation.navigate("ReportLost")}
                style={styles.newButton}
              >
                Report New Lost Item
              </Button>

              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>💡 Pro tip</Text>
                <Text style={styles.tipBody}>
                  Items with photos get <Text style={styles.tipEmphasis}>3× more</Text> responses. Items with rewards get{" "}
                  <Text style={styles.tipEmphasis}>5× more</Text>.
                </Text>
              </View>
            </>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 40,
  },
  newButton: {
    marginTop: 20,
  },
  tipCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.subtle,
  },
  tipEmphasis: {
    fontWeight: "700",
    color: colors.text,
  },
});
