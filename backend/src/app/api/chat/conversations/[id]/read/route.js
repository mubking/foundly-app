import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { success, error } from "@/lib/response";

export async function PATCH(request, context) {
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

    const conversation = await Conversation.findById(id).select("participants").lean();
    if (!conversation) {
      return error("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === user.id);
    if (!isParticipant) {
      return error("You are not a participant in this conversation", 403);
    }

    // Only the other participant's messages, and only the ones still
    // unread — never marks the caller's own sent messages as read. Matching
    // zero documents (nothing unread, or already run once) is a normal
    // outcome, not an error: this makes the endpoint naturally idempotent,
    // and GET /api/chat/conversations' unreadCount (computed live from
    // `read`) reflects the result on its very next call, with nothing
    // further to keep in sync here.
    await Message.updateMany({ conversation: id, sender: { $ne: user.id }, read: false }, { $set: { read: true } });

    return success(undefined, "Conversation marked as read");
  } catch (err) {
    console.error("Mark conversation as read error:", err);
    return error("Something went wrong while updating the conversation", 500);
  }
}
