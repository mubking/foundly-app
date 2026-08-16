import React, { useCallback, useEffect, useMemo } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { STATUS_CONFIG } from "../../constants/myFoundMockData";
import { getMyFoundItems } from "../../services/myItems";
import { useItems } from "../../hooks/useItems";
import { optimizeImageUrl, prefetchImage } from "../../utils/cloudinaryImage";

import Header from "../../components/Header/Header";
import Button from "../../components/Button/Button";
import PlusIcon from "../../components/common/PlusIcon";
import UploadIcon from "../../components/common/UploadIcon";
import Card from "../../components/common/Card";
import StatusItemRow from "../../components/common/StatusItemRow";
import StatusState from "../../components/common/StatusState";

const PAGE_LIMIT = 50;

export default function MyFoundScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { items, meta, status, errorMessage, refreshing, run } = useItems();

  const load = useCallback((options) => run(() => getMyFoundItems({ limit: PAGE_LIMIT }), options), [run]);

  useEffect(() => {
    load();
  }, [load]);

  const summaryStats = useMemo(
    () => [
      { label: "Total Found", value: meta.total, colorKey: "primary" },
      {
        label: "Returned",
        value: items.filter((item) => item.status === "closed").length,
        colorKey: "success",
      },
      {
        label: "Pending",
        value: items.filter((item) => item.status === "claimed").length,
        colorKey: "secondary",
      },
    ],
    [items, meta.total]
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
        title="My Found Items"
        onBack={() => navigation.goBack()}
        right={
          <Button
            variant="green"
            size="xs"
            icon={<PlusIcon size={14} color="#fff" />}
            onPress={() => navigation.navigate("UploadFound")}
          >
            Add
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
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't uploaded any found items yet.</Text>}
          ListFooterComponent={
            <Button
              variant="green"
              fullWidth
              icon={<UploadIcon size={18} color="#fff" />}
              onPress={() => navigation.navigate("UploadFound")}
              style={styles.newButton}
            >
              Upload New Found Item
            </Button>
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
});
