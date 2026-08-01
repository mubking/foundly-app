import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import images from "../../constants/images";
import { MESSAGES } from "../../constants/chatMockData";
import { FINDER } from "../../constants/itemDetailsMockData";

import ArrowLeftIcon from "../../components/common/ArrowLeftIcon";
import PhoneIcon from "../../components/common/PhoneIcon";
import MoreVerticalIcon from "../../components/common/MoreVerticalIcon";
import Avatar from "../../components/Avatar/Avatar";
import ChatItemContext from "../../components/common/ChatItemContext";
import MessageBubble from "../../components/common/MessageBubble";
import SystemMessage from "../../components/common/SystemMessage";
import TypingIndicator from "../../components/common/TypingIndicator";
import ChatInputBar from "../../components/common/ChatInputBar";
import BottomNav from "../../components/BottomNav/BottomNav";

export default function ChatScreen() {
  const navigation = useNavigation();
  const [text, setText] = useState("");

  const handleNavigate = (route) => {
    if (route === "Chat") return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate("Notifications")}>
          <ArrowLeftIcon size={18} color={colors.text} />
        </Pressable>

        <Avatar size={38} initials={FINDER.initials} source={FINDER.avatar} online />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{FINDER.name}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
            <Text style={styles.statusMeta}>
              · {FINDER.returns} returns · ⭐ {FINDER.rating}
            </Text>
          </View>
        </View>

        <Pressable style={styles.headerIconButton}>
          <PhoneIcon size={17} color={colors.ink2} />
        </Pressable>
        <Pressable style={styles.headerIconButton}>
          <MoreVerticalIcon size={17} color={colors.ink2} />
        </Pressable>
      </View>

      <ChatItemContext
        image={images.items.wallet}
        title="Re: Black Leather Wallet"
        subtitle="Found in Times Square · 4h ago"
        style={styles.contextBar}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        {MESSAGES.map((msg) =>
          msg.from === "system" ? (
            <SystemMessage key={msg.id} text={msg.text} />
          ) : (
            <MessageBubble
              key={msg.id}
              text={msg.text}
              time={msg.time}
              isMe={msg.from === "me"}
              read={msg.read}
              avatar={FINDER.avatar}
              avatarInitials={FINDER.initials}
            />
          )
        )}

        <TypingIndicator avatar={FINDER.avatar} avatarInitials={FINDER.initials} />
      </ScrollView>

      <ChatInputBar value={text} onChangeText={setText} />

      <BottomNav active="Chat" onNavigate={handleNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.success,
  },
  statusMeta: {
    fontSize: 12,
    color: colors.subtle,
  },
  contextBar: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  messages: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
});
