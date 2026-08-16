import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useClaimDetails } from "../../hooks/useClaimDetails";

import Header from "../../components/Header/Header";
import StatusState from "../../components/common/StatusState";
import ItemPreviewCard from "../../components/common/ItemPreviewCard";
import ClaimantCard from "../../components/common/ClaimantCard";
import ConversationRow from "../../components/common/ConversationRow";
import ImageViewerModal from "../../components/common/ImageViewerModal";
import SafeImage from "../../components/common/SafeImage";
import Pill from "../../components/common/Pill";
import Button from "../../components/Button/Button";
import MessageCircleIcon from "../../components/common/MessageCircleIcon";
import HelpCircleIcon from "../../components/common/HelpCircleIcon";
import CheckIcon from "../../components/common/CheckIcon";
import XIcon from "../../components/common/XIcon";
import CalendarIcon from "../../components/common/CalendarIcon";
import MapPinIcon from "../../components/common/MapPinIcon";
import { CLAIM_STATUS_VARIANT as STATUS_VARIANT, CLAIM_STATUS_LABEL as STATUS_LABEL } from "../../constants/claimStatus";

// A starting point the owner can edit before sending, not an auto-sent
// message — see ChatScreen's `initialText` handling.
const REQUEST_INFO_MESSAGE = "Hi! Could you share a bit more detail or proof to help verify this claim?";

/**
 * Dedicated claim-review screen — replaces routing a claim notification (or
 * a tap on "Claims on My Items") to the generic Item Details page. Reuses
 * existing pieces throughout: ItemPreviewCard/ConversationRow (already used
 * elsewhere), and the same ChatThread navigation contract/recipient
 * selection ItemDetailsScreen and ClaimCard already established (never a
 * self-chat — `claim.claimant` is always the "other" participant here,
 * since only the item's owner can reach this screen — see
 * backend/src/app/api/claims/[id]/route.js's authorization check).
 */
export default function ClaimDetailsScreen() {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};

  const {
    claim,
    status,
    errorMessage,
    reviewing,
    reviewError,
    conversation,
    conversationLoading,
    load,
    handleReview,
  } = useClaimDetails(id);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (status !== "success" || !claim) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <Header title="Claim Details" onBack={() => navigation.goBack()} />
        {status === "loading" ? (
          <StatusState loading />
        ) : (
          <StatusState message={errorMessage || "Couldn't load this claim."} actionLabel="Retry" onAction={load} />
        )}
      </SafeAreaView>
    );
  }

  const goToChat = (initialText) => {
    navigation.navigate("ChatThread", {
      // Submitting a claim now eagerly creates its conversation (see
      // backend/src/app/api/claims/create/route.js), so `conversation` here
      // — the preview useClaimDetails already fetched — should always be
      // set by the time a claim exists to view. Preferring its id (over
      // recipientId) means ChatScreen loads with the real message history
      // (including the claim's system message) immediately, not only after
      // the first message sent in this session. `recipientId` stays as a
      // defensive fallback for the case it somehow isn't set.
      conversationId: conversation?.id,
      recipientId: conversation?.id ? undefined : claim.claimant.id,
      participant: claim.claimant,
      itemId: claim.item.id,
      itemType: claim.item.type,
      itemTitle: claim.item.title,
      itemImage: claim.item.image,
      itemStatus: claim.item.status,
      initialText,
    });
  };

  const evidenceImages = claim.proofImage ? [claim.proofImage] : [];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header title="Claim Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ItemPreviewCard
          image={claim.item.image}
          type={claim.item.type}
          title={claim.item.title}
          reward={claim.item.reward}
          location={claim.item.location}
          time={claim.item.date}
        />

        <ClaimantCard claimant={claim.claimant} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Claimant's Explanation</Text>
          <Text style={styles.messageText}>{claim.message}</Text>
        </View>

        {evidenceImages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Evidence</Text>
            <Pressable onPress={() => setViewerVisible(true)} accessibilityRole="button" accessibilityLabel="View evidence photo full-screen">
              <SafeImage source={claim.proofImage} style={styles.evidenceImage} iconSize={28} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <CalendarIcon size={15} color={colors.subtle} />
            <Text style={styles.metaText}>Submitted {claim.submittedTime}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPinIcon size={15} color={colors.subtle} />
            <Text style={styles.metaText}>
              {claim.item.type === "lost" ? "Lost" : "Found"} {claim.item.date} · {claim.item.location}
            </Text>
          </View>
          {claim.reward ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Claimant is offering a ${claim.reward} reward</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Conversation</Text>
          {conversationLoading ? (
            <StatusState loading style={styles.conversationLoading} />
          ) : conversation ? (
            <ConversationRow
              conversation={conversation}
              onPress={() =>
                navigation.navigate("ChatThread", {
                  conversationId: conversation.id,
                  participant: conversation.participant,
                  itemId: conversation.item?.id,
                  itemTitle: conversation.item?.title,
                  itemType: conversation.item?.type,
                })
              }
            />
          ) : (
            <Text style={styles.emptyConversationText}>No messages yet with this claimant.</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Button
            variant="outline"
            size="md"
            style={styles.actionButton}
            icon={<MessageCircleIcon size={16} color={colors.primary} />}
            onPress={() => goToChat()}
          >
            Message
          </Button>
          <Button
            variant="outline"
            size="md"
            style={styles.actionButton}
            icon={<HelpCircleIcon size={16} color={colors.primary} />}
            onPress={() => goToChat(REQUEST_INFO_MESSAGE)}
          >
            Request Info
          </Button>
        </View>

        {claim.status === "pending" ? (
          <>
            {reviewError ? <Text style={styles.reviewErrorText}>{reviewError}</Text> : null}
            <View style={styles.actionsRow}>
              <Button
                variant="red"
                size="md"
                style={styles.actionButton}
                disabled={reviewing}
                icon={<XIcon size={16} color="#fff" strokeWidth={3} />}
                onPress={() => handleReview("rejected")}
              >
                Reject
              </Button>
              <Button
                variant="green"
                size="md"
                style={styles.actionButton}
                disabled={reviewing}
                icon={<CheckIcon size={16} color="#fff" strokeWidth={3} />}
                onPress={() => handleReview("approved")}
              >
                {reviewing ? "Updating…" : "Approve"}
              </Button>
            </View>
          </>
        ) : (
          <Pill label={STATUS_LABEL[claim.status]} variant={STATUS_VARIANT[claim.status]} style={styles.statusPill} />
        )}
      </ScrollView>

      <ImageViewerModal
        visible={viewerVisible}
        images={evidenceImages}
        activeIndex={viewerIndex}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerVisible(false)}
        topInset={insets.top}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtle,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  messageText: {
    fontSize: 14,
    color: colors.ink2,
    lineHeight: 22,
  },
  evidenceImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  metaCard: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.textLight,
    flexShrink: 1,
  },
  conversationLoading: {
    flex: 0,
    paddingVertical: 20,
  },
  emptyConversationText: {
    fontSize: 13,
    color: colors.textLight,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  reviewErrorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
  },
  statusPill: {
    alignSelf: "center",
  },
});
