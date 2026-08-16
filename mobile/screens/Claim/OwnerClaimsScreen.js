import React, { useMemo } from "react";
import { Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useOwnerClaims } from "../../hooks/useOwnerClaims";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import ClaimCard from "../../components/common/ClaimCard";

export default function OwnerClaimsScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const {
    claims,
    status,
    errorMessage,
    refreshing,
    loadingMore,
    hasMore,
    reviewingId,
    reviewError,
    load,
    loadMore,
    handleReview,
  } = useOwnerClaims();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Claims on My Items" onBack={() => navigation.goBack()} />

      {reviewError ? <Text style={styles.reviewError}>{reviewError}</Text> : null}

      {status === "loading" ? (
        <StatusState loading />
      ) : status === "error" ? (
        <StatusState message={errorMessage} actionLabel="Retry" onAction={() => load()} />
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(claim) => claim.id}
          renderItem={({ item: claim }) => (
            <ClaimCard
              claim={claim}
              isReviewing={reviewingId === claim.id}
              onApprove={() => handleReview(claim.id, "approved")}
              onReject={() => handleReview(claim.id, "rejected")}
              onMessage={() =>
                navigation.navigate("ChatThread", {
                  recipientId: claim.claimant?.id,
                  participant: claim.claimant,
                  itemId: claim.item.id,
                  itemType: claim.item.type,
                  itemTitle: claim.item.title,
                })
              }
              onPress={() => navigation.navigate("ClaimDetails", { id: claim.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ isRefresh: true })} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={<Text style={styles.emptyText}>No one has claimed your items yet.</Text>}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
            ) : claims.length > 0 && !hasMore ? (
              <Text style={styles.endText}>You've seen it all</Text>
            ) : null
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
  reviewError: {
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
  footerLoader: {
    paddingVertical: 16,
  },
  endText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 16,
  },
});
