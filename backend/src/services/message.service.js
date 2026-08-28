import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Claim from "@/models/Claim";
import { notify } from "@/lib/notifications";
import { isBlockedEitherDirection } from "@/services/block.service";
import { evaluateMessageSent } from "@/services/spam-detection.service";

// Maps the public "lost"/"found" wording (used everywhere else in the API)
// to the actual model to check and the model-name string Conversation.itemType
// needs for its refPath to resolve populate() correctly — same lookup shape
// as claims/create's ITEM_LOOKUP.
const ITEM_LOOKUP = {
  lost: { Model: LostItem, modelName: "LostItem" },
  found: { Model: FoundItem, modelName: "FoundItem" },
};

const MODEL_BY_NAME = { LostItem, FoundItem };

/**
 * Thrown by {@link createMessage}/{@link findOrCreateConversation} for any
 * expected business-rule failure (bad id, not found, not a participant,
 * ...). Carries the HTTP status a caller should respond with — same shape
 * as lib/auth.js's AuthError.
 */
export class MessageServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "MessageServiceError";
    this.status = status;
  }
}

/**
 * Finds the existing 1:1 conversation between two users, or creates one —
 * the single place this dedup logic lives, so every caller that might need
 * a conversation between a specific pair of users (sending the first
 * message, or claims/create/route.js seeding a claim's conversation with a
 * system message) shares exactly one "does this pair already have a
 * conversation" check instead of each reimplementing it. Never creates a
 * second conversation for a pair that already has one.
 *
 * @param {object} input
 * @param {string} input.participantAId
 * @param {string} input.participantBId
 * @param {string} [input.itemId] - Only used if a *new* conversation is created — an existing conversation's item context (if any) was set once, at creation (see Conversation.item's schema comment).
 * @param {"lost"|"found"} [input.itemType]
 * @returns {Promise<import("mongoose").Document>}
 * @throws {MessageServiceError} If `itemId` is provided but doesn't resolve to a real item.
 */
export async function findOrCreateConversation({ participantAId, participantBId, itemId, itemType }) {
  await connectDB();

  let conversation = await Conversation.findOne({
    participants: { $all: [participantAId, participantBId], $size: 2 },
  });

  if (conversation) return conversation;

  let itemFields = {};
  if (itemId) {
    const { Model, modelName } = ITEM_LOOKUP[itemType];
    const item = await Model.findById(itemId).select("_id").lean();
    if (!item) {
      throw new MessageServiceError("Item not found", 404);
    }
    itemFields = { item: itemId, itemType: modelName };
  }

  return Conversation.create({
    participants: [participantAId, participantBId],
    ...itemFields,
  });
}

/**
 * Resolves the target conversation (creating one if needed) and creates a
 * message in it. This is the transport-agnostic core of "send a message" —
 * it's called from POST /api/chat/messages today, and is meant to also
 * back the Socket.IO chat handler once that's implemented, so it takes
 * plain data in and returns plain Mongoose documents out (no
 * Request/Response, no HTTP-shaped success/error envelope).
 *
 * Exactly one of `conversationId`/`recipientId` must be provided —
 * validated upstream by sendMessageSchema, same as before extraction.
 *
 * @param {object} input
 * @param {string} input.senderId
 * @param {string} [input.conversationId]
 * @param {string} [input.recipientId]
 * @param {string} [input.itemId]
 * @param {"lost"|"found"} [input.itemType]
 * @param {string} input.text
 * @returns {Promise<{conversation: import("mongoose").Document, message: import("mongoose").Document}>}
 * @throws {MessageServiceError}
 */
export async function createMessage({
  senderId,
  conversationId,
  recipientId,
  itemId,
  itemType,
  text,
}) {
  if (itemId && !mongoose.Types.ObjectId.isValid(itemId)) {
    throw new MessageServiceError("Invalid item ID", 400);
  }

  await connectDB();

  let conversation;

  if (conversationId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new MessageServiceError("Invalid conversation ID", 400);
    }

    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new MessageServiceError("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === senderId);
    if (!isParticipant) {
      throw new MessageServiceError("You are not a participant in this conversation", 403);
    }

    // Existing chats become read-only once either side has blocked the
    // other — GET messages still works (no check there), only sending is
    // stopped.
    const otherParticipantId = conversation.participants.map(String).find((id) => id !== senderId);
    if (otherParticipantId && (await isBlockedEitherDirection(senderId, otherParticipantId))) {
      throw new MessageServiceError("You can't message this user", 403);
    }

    // Option B (account deactivation): a deactivated/suspended recipient
    // can no longer receive new messages. History stays intact and readable,
    // but sending stops — checked before Message.create so no Message
    // document, notification, email, or socket emit happens.
    if (otherParticipantId) {
      const otherParticipant = await User.findById(otherParticipantId).select("isActive").lean();
      if (!otherParticipant || otherParticipant.isActive === false) {
        throw new MessageServiceError("You can't message this user", 403);
      }
    }
  } else {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new MessageServiceError("Invalid recipient ID", 400);
    }

    if (recipientId === senderId) {
      throw new MessageServiceError("You cannot start a conversation with yourself", 400);
    }

    const recipient = await User.findById(recipientId).select("_id isActive").lean();
    if (!recipient) {
      throw new MessageServiceError("Recipient not found", 404);
    }
    // Option B (account deactivation): you cannot start a new conversation
    // with a deactivated/suspended account.
    if (recipient.isActive === false) {
      throw new MessageServiceError("You can't message this user", 403);
    }

    // Checked before findOrCreateConversation so a blocked pair never gets
    // a new conversation shell created for them either — "cannot start new
    // conversations."
    if (await isBlockedEitherDirection(senderId, recipientId)) {
      throw new MessageServiceError("You can't message this user", 403);
    }

    conversation = await findOrCreateConversation({
      participantAId: senderId,
      participantBId: recipientId,
      itemId,
      itemType,
    });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text,
  });

  // .save() bumps updatedAt via the schema's timestamps option, which is
  // what the conversation list's "newest first" ordering sorts on.
  conversation.lastMessage = message._id;
  await conversation.save();

  // Fire-and-forget — never allowed to fail or delay a successful send.
  evaluateMessageSent({ senderId, conversationId: conversation._id.toString() });

  // Real-time delivery while the recipient is actively chatting is handled
  // entirely by socket/handlers/chat.js's own message:new event — this
  // notify() call is what makes a new message reach them when they aren't
  // (background/killed push, via lib/notifications.js -> lib/push.js).
  // Always exactly one other participant (Conversation.participants is
  // validated to length 2), so no "which participant" ambiguity here. Named
  // distinctly from the `recipientId` param above — that one is only set
  // when starting a brand-new conversation; this is the notification
  // target for every message, on both the new- and existing-conversation
  // paths.
  const messageRecipientId = conversation.participants.map(String).find((id) => id !== senderId);
  if (messageRecipientId) {
    const sender = await User.findById(senderId).select("firstName lastName avatar isActive").lean();
    // Option B (account deactivation): a deactivated sender's identity is
    // never snapshotted onto notifications — show "Deleted User" instead.
    const senderInactive = Boolean(sender && sender.isActive === false);
    const senderName = !sender
      ? "Someone"
      : senderInactive
      ? "Deleted User"
      : `${sender.firstName} ${sender.lastName}`.trim();

    // Snapshotted onto the Notification itself (senderAvatar/itemTitle) so
    // the notification list/toast/push payload can render richly without a
    // join back to the sender or item — see models/Notification.js.
    let itemTitle = null;
    // While the sender has a claim still pending review on this
    // conversation's item, their messages here are follow-ups the owner is
    // waiting on — framed as a claim event ("X replied with more
    // information"), not a generic chat preview, matching how claim
    // submitted/approved/rejected are already surfaced. Once the claim is
    // resolved (or there never was one on this item), it's just chat.
    let isClaimReply = false;
    if (conversation.item && conversation.itemType) {
      const ItemModel = MODEL_BY_NAME[conversation.itemType];
      const item = await ItemModel.findById(conversation.item).select("title").lean();
      itemTitle = item?.title || null;

      const pendingClaim = await Claim.findOne({
        item: conversation.item,
        itemType: conversation.itemType,
        claimant: senderId,
        status: "pending",
      })
        .select("_id")
        .lean();
      isClaimReply = Boolean(pendingClaim);
    }

    await notify({
      recipient: messageRecipientId,
      title: senderName || "New message",
      message: isClaimReply ? `${senderName} replied with more information.` : text,
      type: isClaimReply ? "claim_reply" : "new_message",
      targetType: "Conversation",
      targetId: conversation._id,
      senderAvatar: senderInactive ? null : sender?.avatar || null,
      itemTitle,
    });
  }

  return { conversation, message };
}
