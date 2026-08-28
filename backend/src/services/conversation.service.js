import mongoose from "mongoose";

import Message from "@/models/Message";
import Claim from "@/models/Claim";

// Shared between GET /api/chat/conversations (list) and
// GET /api/chat/conversations/:id (single) so both render a conversation
// identically instead of each maintaining its own field list/mapper.
// `isActive` is read by toConversationResult so a deactivated participant
// is represented as "Deleted User" without an avatar.
export const PARTICIPANT_SELECT = "firstName lastName avatar isVerified isActive";
export const LAST_MESSAGE_SELECT = "text sender createdAt read";
// `images` so a conversation can render its item's real photo (first
// upload) everywhere a thread previews the item it's about — both chat
// endpoints map it onto `item.image` via toConversationResult below. Both
// LostItem and FoundItem store Cloudinary URLs in `images: string[]` (may
// be empty); callers treat a missing/null image as "no image" and show
// their neutral placeholder rather than inventing a photo.
export const ITEM_SELECT = "title images";

/**
 * Maps one populated, `.lean()`ed Conversation document into the shape
 * both chat endpoints return. `unreadCounts` is a `Map<conversationId,
 * count>` — see {@link getUnreadCounts}.
 *
 * @param {object} conversation
 * @param {string} currentUserId
 * @param {Map<string, number>} unreadCounts
 * @returns {object}
 */
export function toConversationResult(conversation, currentUserId, unreadCounts) {
  const other = conversation.participants.find((p) => p._id.toString() !== currentUserId);
  // Option B (account deactivation): a deactivated participant still has a
  // retained document, but their identity must not be surfaced — show a
  // neutral "Deleted User" with no avatar instead.
  const otherInactive = Boolean(other && other.isActive === false);

  return {
    id: conversation._id,
    participant: other
      ? {
          id: other._id,
          firstName: otherInactive ? "Deleted" : other.firstName,
          lastName: otherInactive ? "User" : other.lastName,
          avatar: otherInactive ? null : other.avatar,
          isVerified: otherInactive ? false : other.isVerified || false,
        }
      : null,
    item: conversation.item
      ? {
          id: conversation.item._id,
          title: conversation.item.title,
          type: conversation.itemType === "LostItem" ? "lost" : "found",
          // First upload, so a chat thread can show the item's real photo.
          // Null when the listing genuinely has no image — callers keep
          // their neutral placeholder in that case.
          image: conversation.item.images?.[0] ?? null,
        }
      : null,
    lastMessage: conversation.lastMessage
      ? {
          id: conversation.lastMessage._id,
          text: conversation.lastMessage.text,
          sender: conversation.lastMessage.sender,
          createdAt: conversation.lastMessage.createdAt,
        }
      : null,
    unreadCount: unreadCounts.get(conversation._id.toString()) || 0,
    updatedAt: conversation.updatedAt,
  };
}

/**
 * Unread-per-conversation aggregation — factored out of the list endpoint
 * so the single-conversation endpoint can run the exact same pipeline for
 * just one id instead of reimplementing "unread = not sent by me, not read".
 *
 * @param {import("mongoose").Types.ObjectId[]} conversationIds
 * @param {string} currentUserId
 * @returns {Promise<Map<string, number>>}
 */
export async function getUnreadCounts(conversationIds, currentUserId) {
  const counts = await Message.aggregate([
    {
      $match: {
        conversation: { $in: conversationIds },
        sender: { $ne: new mongoose.Types.ObjectId(currentUserId) },
        read: false,
      },
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((u) => [u._id.toString(), u.count]));
}

/**
 * Looks up the claim a conversation is tied to, via the explicit
 * Claim.conversation link set at claim submission (see
 * claims/create/route.js) — not derived from the conversation's `item` +
 * `participants`. That inference is what this replaced, and it was
 * unsound: Conversation.item is set once, at conversation creation, but
 * conversations themselves are found/reused purely by participant pair
 * (see message.service.js#findOrCreateConversation) — never scoped to an
 * item. Two users who'd already messaged about a *different* item before
 * this claim existed would make an item-based lookup resolve to the wrong
 * claim (whichever one also matched that stale item) or none at all,
 * which is exactly how a conversation could end up showing another
 * claimant's evidence, or the wrong item's, instead of its own.
 *
 * Sorted newest-first and limited to one as a defensive tie-break for the
 * one case two claims can legitimately share a conversation — the same
 * claimant later filing a second claim against the same owner reuses their
 * existing conversation — so the pinned card always reflects the most
 * recent claim, not an arbitrary one.
 *
 * @param {object} conversation - `.lean()`ed.
 * @param {string} currentUserId
 * @returns {Promise<object|null>} `{id, status, message, proofImage, createdAt, isOwnerViewing}`, or `null` if this conversation has no associated claim.
 */
export async function findClaimForConversation(conversation, currentUserId) {
  const claim = await Claim.findOne({ conversation: conversation._id })
    .select("status message proofImage claimant createdAt")
    .sort({ createdAt: -1 })
    .lean();

  if (!claim) return null;

  return {
    id: claim._id,
    status: claim.status,
    message: claim.message,
    proofImage: claim.proofImage ?? null,
    createdAt: claim.createdAt,
    // The claimant is always one of this conversation's two participants —
    // if the caller isn't them, they must be the item's owner (a
    // conversation only ever has these two people in it).
    isOwnerViewing: claim.claimant.toString() !== currentUserId,
  };
}
