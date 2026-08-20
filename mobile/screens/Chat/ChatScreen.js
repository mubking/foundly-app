import React, { useCallback, useRef, useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useMessages } from "../../hooks/useMessages";
import { useConversationDetails } from "../../hooks/useConversationDetails";
import { getInitials } from "../../utils/initials";
import { CLAIM_STATUS_VARIANT, CLAIM_STATUS_LABEL } from "../../constants/claimStatus";
import { setActiveConversationId } from "../../services/activeConversation";

import ArrowLeftIcon from "../../components/common/ArrowLeftIcon";
import Avatar from "../../components/Avatar/Avatar";
import CheckCircleIcon from "../../components/common/CheckCircleIcon";
import Pill from "../../components/common/Pill";
import ChatItemContext from "../../components/common/ChatItemContext";
import ClaimContextCard from "../../components/common/ClaimContextCard";
import MessageBubble from "../../components/common/MessageBubble";
import SystemMessage from "../../components/common/SystemMessage";
import StatusState from "../../components/common/StatusState";
import ChatInputBar from "../../components/common/ChatInputBar";
import ImageViewerModal from "../../components/common/ImageViewerModal";
import KeyboardAvoidingScreen from "../../components/common/KeyboardAvoidingScreen";

export default function ChatScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    conversationId,
    recipientId,
    participant: routeParticipant,
    itemId: routeItemId,
    itemType: routeItemType,
    itemTitle: routeItemTitle,
    itemImage,
    itemStatus,
    initialText,
  } = route.params || {};

  // Authoritative once a conversationId exists — see the hook's own doc
  // comment for why this, and not the navigation params above, is what
  // fixes "Unknown user" for good (reopening from the inbox, or
  // deep-linking from a notification, never carried a `participant` at
  // all). Only a brand-new conversation (recipientId, no id yet) has
  // nothing to fetch, so it keeps using the params above.
  const { details } = useConversationDetails(conversationId);
  const participant = details?.participant || routeParticipant;
  const itemId = details?.item?.id || routeItemId;
  const itemType = details?.item?.type || routeItemType;
  const itemTitle = details?.item?.title || routeItemTitle;
  const claim = details?.claim || null;

  // Only ever read once, on mount — a starting point the sender can edit
  // (e.g. "Request Info" from Claim Details), not an auto-sent message.
  const [text, setText] = useState(initialText || "");
  const [evidenceVisible, setEvidenceVisible] = useState(false);
  const [sendError, setSendError] = useState(null);
  const scrollRef = useRef(null);

  const {
    messages,
    loading,
    sending,
    error,
    conversationId: liveConversationId,
    sendMessage,
    retryMessage,
    refresh,
  } = useMessages({
    conversationId,
    recipientId,
    itemId,
    itemType,
  });

  // Lets NotificationToastHost skip a redundant "new message" toast for the
  // conversation the user is already looking at — that message already
  // arrives live via useMessages' own socket subscription. Cleared on blur
  // (navigating away) as well as unmount, since React Navigation keeps
  // screens mounted-but-blurred in its stack.
  useFocusEffect(
    useCallback(() => {
      setActiveConversationId(liveConversationId);
      return () => setActiveConversationId(null);
    }, [liveConversationId])
  );

  const name = participant ? `${participant.firstName} ${participant.lastName}`.trim() : "Unknown user";

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const pending = text;
    setText("");

    // On failure the bubble itself stays in the list (flagged `failed`) with
    // its own tap-to-retry — the text isn't restored to the input, since
    // that would duplicate it in both places.
    const result = await sendMessage(pending);
    setSendError(result.ok ? null : result.message || "Please try again.");
  };

  const handleRetry = useCallback(
    async (msg) => {
      setSendError(null);
      const result = await retryMessage(msg.id, msg.text);
      if (!result.ok) setSendError(result.message || "Please try again.");
    },
    [retryMessage]
  );

  const renderMessage = useCallback(
    ({ item: msg }) =>
      msg.isSystem ? (
        <SystemMessage text={msg.text} />
      ) : (
        <MessageBubble
          text={msg.text}
          time={msg.time}
          isMe={msg.sender === user?.id}
          read={msg.read}
          avatar={participant?.avatar}
          avatarInitials={getInitials(participant)}
          failed={msg.failed}
          onRetry={() => handleRetry(msg)}
        />
      ),
    [user?.id, participant, handleRetry]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingScreen behavior="translate-with-padding">
        <View style={styles.header}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeftIcon size={18} color={colors.text} />
          </Pressable>

          <Avatar size={38} initials={getInitials(participant)} source={participant?.avatar} />

          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {name}
              </Text>
              {participant?.isVerified ? <CheckCircleIcon size={14} color={colors.success} /> : null}
            </View>
            {itemTitle ? (
              <View style={styles.headerMetaRow}>
                <Text style={styles.headerItemTitle} numberOfLines={1}>
                  {itemTitle}
                </Text>
                {claim ? (
                  <Pill
                    label={CLAIM_STATUS_LABEL[claim.status]}
                    variant={CLAIM_STATUS_VARIANT[claim.status]}
                    style={styles.headerStatusPill}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {claim ? (
          <ClaimContextCard
            image={itemImage || null}
            title={itemTitle}
            status={claim.status}
            submittedTime={claim.submittedTime}
            hasEvidence={!!claim.proofImage}
            isOwnerViewing={claim.isOwnerViewing}
            onViewItem={itemId ? () => navigation.navigate("ItemDetails", { id: itemId }) : undefined}
            onViewEvidence={() => setEvidenceVisible(true)}
            style={styles.contextBar}
          />
        ) : itemTitle ? (
          // From Item Details, itemImage is the item's real photo (passed
          // directly, already loaded on that screen). From the inbox, only
          // conversation.item's {id, title, type} exist — GET
          // /api/chat/conversations doesn't populate an image for it — so
          // this falls back to `null`, which SafeImage renders as its own
          // neutral "no image" icon rather than inventing a stock photo.
          <ChatItemContext
            image={itemImage || null}
            title={itemTitle}
            status={itemStatus}
            onPress={itemId ? () => navigation.navigate("ItemDetails", { id: itemId }) : undefined}
            style={styles.contextBar}
          />
        ) : null}

        {loading ? (
          <StatusState loading />
        ) : error ? (
          <StatusState message={error} actionLabel="Retry" onAction={refresh} />
        ) : (
          <FlatList
            ref={scrollRef}
            data={messages}
            keyExtractor={(msg) => msg.id}
            renderItem={renderMessage}
            style={styles.scroll}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={<Text style={styles.emptyText}>Say hello — no messages yet.</Text>}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews
          />
        )}

        {sendError ? <Text style={styles.sendErrorText}>{sendError}</Text> : null}
        <ChatInputBar
          value={text}
          onChangeText={(value) => {
            setText(value);
            if (sendError) setSendError(null);
          }}
          onSend={handleSend}
        />
      </KeyboardAvoidingScreen>

      {claim?.proofImage ? (
        <ImageViewerModal
          visible={evidenceVisible}
          images={[claim.proofImage]}
          activeIndex={0}
          onIndexChange={() => {}}
          onClose={() => setEvidenceVisible(false)}
          topInset={insets.top}
        />
      ) : null}
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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
  headerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  headerItemTitle: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textLight,
  },
  headerStatusPill: {
    flexShrink: 0,
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
  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 40,
  },
  sendErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
