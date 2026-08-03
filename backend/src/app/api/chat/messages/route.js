import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { sendMessageSchema } from "@/validations/chat.validation";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import { success, error } from "@/lib/response";

export async function POST(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const { conversationId, recipientId, text } = parsed.data;

    await connectDB();

    let conversation;

    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return error("Invalid conversation ID", 400);
      }

      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return error("Conversation not found", 404);
      }

      const isParticipant = conversation.participants.some((p) => p.toString() === user.id);
      if (!isParticipant) {
        return error("You are not a participant in this conversation", 403);
      }
    } else {
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return error("Invalid recipient ID", 400);
      }

      if (recipientId === user.id) {
        return error("You cannot start a conversation with yourself", 400);
      }

      const recipient = await User.findById(recipientId).select("_id").lean();
      if (!recipient) {
        return error("Recipient not found", 404);
      }

      // A conversation is uniquely identified by its pair of participants —
      // look for an existing one before creating a new one.
      conversation = await Conversation.findOne({
        participants: { $all: [user.id, recipientId], $size: 2 },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [user.id, recipientId],
        });
      }
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: user.id,
      text,
    });

    // .save() bumps updatedAt via the schema's timestamps option, which is
    // what the conversation list's "newest first" ordering sorts on.
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    return success(
      {
        id: newMessage._id,
        conversationId: conversation._id,
        sender: newMessage.sender,
        text: newMessage.text,
        read: newMessage.read,
        createdAt: newMessage.createdAt,
      },
      "Message sent successfully",
      201
    );
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Send message error:", err);
    return error("Something went wrong while sending the message", 500);
  }
}
