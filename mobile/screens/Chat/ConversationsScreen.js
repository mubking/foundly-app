import React, { useMemo } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

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
  const { conversations, loading, refreshing, error, refresh, markRead } = useConversations();

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
