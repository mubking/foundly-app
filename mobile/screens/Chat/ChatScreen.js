import React, { useCallback, useRef, useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useMessages } from "../../hooks/useMessages";
import { useConversationDetails } from "../../hooks/useConversationDetails";
import { getInitials } from "../../utils/initials";
import { CLAIM_STATUS_VARIANT, CLAIM_STATUS_LABEL } from "../../constants/claimStatus";
import { setActiveConversationId } from "../../services/activeConversation";
import { blockUser } from "../../services/blocks";

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
import MoreVerticalIcon from "../../components/common/MoreVerticalIcon";
import ShieldIcon from "../../components/common/ShieldIcon";

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
    itemImage: routeItemImage,
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
  // The item's real photo: the backend now populates `conversation.item.image`
  // (first Cloudinary upload — see backend/src/services/conversation.service.js),
  // so `details` is authoritative whenever a conversationId exists (opened
  // from the inbox, or deep-linked from a notification). Only a brand-new
  // conversation (recipientId, no conversationId yet — nothing to fetch)
  // relies on the raw URL Item Details passed through. Normalized to
  // `{ uri }` so SafeImage always receives the same source shape; null when
  // the item genuinely has no image, which SafeImage renders as its own
  // neutral "no image" icon rather than inventing a stock photo.
  const itemImage = details?.item?.image
    ? details.item.image
    : typeof routeItemImage === "string" && routeItemImage
      ? { uri: routeItemImage }
      : null;
  const claim = details?.claim || null;

  // Only ever read once, on mount — a starting point the sender can edit
  // (e.g. "Request Info" from Claim Details), not an auto-sent message.
  const [text, setText] = useState(initialText || "");
  const [evidenceVisible, setEvidenceVisible] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
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

  // Safety action (chat section of the production audit): stops this user
  // from messaging back or starting a new conversation, in either
  // direction — see backend/src/services/block.service.js's
  // isBlockedEitherDirection, which every send already checks. Local-only
  // `blocked` flag: we just performed the action ourselves, so there's no
  // need to refetch anything to know it's in effect for the rest of this
  // session. Managing/undoing it lives in Settings > Blocked Users.
  const confirmBlock = async () => {
    if (!participant?.id || blocking) return;
    setBlocking(true);
    try {
      await blockUser(participant.id);
      setBlocked(true);
      setSendError(null);
    } catch (err) {
      setSendError(err.message || "Couldn't block this user. Please try again.");
    } finally {
      setBlocking(false);
    }
  };

  const handleBlockPress = () => {
    Alert.alert(
      `Block ${name}?`,
      "They won't be able to message you, and you won't be able to message them. You can undo this later from Settings > Blocked Users.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: confirmBlock },
      ]
    );
  };

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

          {!blocked && participant?.id ? (
            <Pressable
              style={styles.headerIconButton}
              onPress={handleBlockPress}
              accessibilityRole="button"
              accessibilityLabel={`Block ${name}`}
            >
              <MoreVerticalIcon size={18} color={colors.text} />
            </Pressable>
          ) : null}
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
          // `itemImage` above is the item's real photo: passed through
          // directly when arriving from Item Details, or resolved from the
          // conversation details fetched by useConversationDetails (the
          // backend populates conversation.item.image for both lost and
          // found items — see backend/src/services/conversation.service.js).
          // Only when the item has no usable image does SafeImage render
          // its neutral "no image" icon rather than inventing a stock photo.
          <ChatItemContext
            image={itemImage}
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
        {blocked ? (
          <View style={styles.blockedNotice}>
            <ShieldIcon size={16} color={colors.textLight} />
            <Text style={styles.blockedNoticeText}>
              You've blocked {name}. They can't message you, and you can't message them.
            </Text>
          </View>
        ) : (
          <ChatInputBar
            value={text}
            onChangeText={(value) => {
              setText(value);
              if (sendError) setSendError(null);
            }}
            onSend={handleSend}
          />
        )}
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
  blockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  blockedNoticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textLight,
  },
});
