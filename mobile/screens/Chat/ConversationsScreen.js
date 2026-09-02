import React, { useCallback, useMemo, useRef } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useConversations } from "../../hooks/useConversations";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import ConversationRow from "../../components/common/ConversationRow";
import BottomNav from "../../components/BottomNav/BottomNav";

export default function ConversationsScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { conversations, loading, refreshing, error, refresh, refreshSilently, markRead } = useConversations();

  // Refetch silently every time the Messages tab regains focus (not just on
  // mount), so participant names/avatars/block state are always fresh — e.g.
  // a conversation partner who deactivated their account shows as
  // "Deleted User" right away instead of the stale pre-deactivation name
  // until a manual pull-to-refresh. The first focus is the mount itself
  // (useConversations already loads there), so it's skipped to avoid a
  // duplicate fetch.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refreshSilently();
    }, [refreshSilently])
  );

  const handleNavigate = (route) => {
    if (route === "Chat") return;
    navigation.navigate(route);
  };

  const handleOpen = (conversation) => {
    // Fire-and-forget: clears the badge in the background without making
    // the tap wait on a network round trip before navigating.
    if (conversation.unreadCount > 0) markRead(conversation.id);

    navigation.navigate("ChatThread", {
      conversationId: conversation.id,
      participant: conversation.participant,
      itemId: conversation.item?.id,
      itemTitle: conversation.item?.title,
      itemType: conversation.item?.type,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Messages" onBack={() => navigation.goBack()} />

      {loading ? (
        <StatusState loading />
      ) : error ? (
        <StatusState message={error} actionLabel="Retry" onAction={refresh} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow conversation={item} onPress={() => handleOpen(item)} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No conversations yet.</Text>}
        />
      )}

      <BottomNav active="Chat" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  separator: {
    height: 10,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 40,
  },
});
