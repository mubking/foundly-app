import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import Conversation from "@/models/Conversation";
// Not used directly, but Conversation.participants/lastMessage/item only
// store refs — Mongoose needs the User/Message/LostItem/FoundItem schemas
// registered in this module's scope before .populate() can resolve them.
import "@/models/User";
import "@/models/LostItem";
import "@/models/FoundItem";
import { success, error } from "@/lib/response";
import {
  PARTICIPANT_SELECT,
  LAST_MESSAGE_SELECT,
  ITEM_SELECT,
  toConversationResult,
  getUnreadCounts,
  getBlockStateForUser,
  findClaimForConversation,
} from "@/services/conversation.service";

// Backs ChatScreen resolving authoritative participant/item/claim details
// from a `conversationId` alone (reopening from the inbox, or deep-linking
// from a "new_message"/claim notification) — the single source of truth
// for "who is this conversation with," instead of trusting whatever
// (possibly absent) `participant` a caller's navigation params happened to
// carry. See mobile/hooks/useConversationDetails.js.
export async function GET(request, context) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid conversation ID", 400);
    }

    await connectDB();

    const conversation = await Conversation.findById(id)
      .populate({ path: "participants", select: PARTICIPANT_SELECT })
      .populate({ path: "lastMessage", select: LAST_MESSAGE_SELECT })
      .populate({ path: "item", select: ITEM_SELECT })
      .lean();

    if (!conversation) {
      return error("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some((p) => p._id.toString() === user.id);
    if (!isParticipant) {
      return error("You are not a participant in this conversation", 403);
    }

    const [unreadMap, claim, blockState] = await Promise.all([
      getUnreadCounts([conversation._id], user.id),
      findClaimForConversation(conversation, user.id),
      getBlockStateForUser(user.id),
    ]);

    return success({
      ...toConversationResult(conversation, user.id, unreadMap, blockState),
      claim,
    });
  } catch (err) {
    console.error("Get conversation error:", err);
    return error("Something went wrong while fetching the conversation", 500);
  }
}
