import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, requireActiveUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import { sendMessageSchema } from "@/validations/chat.validation";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { createMessage, MessageServiceError } from "@/services/message.service";
import { success, error } from "@/lib/response";
import { rateLimitOrError } from "@/lib/rateLimit";
import { withRequestLogging } from "@/lib/logger";

const MESSAGE_SELECT = "conversation sender text read isSystem createdAt";

function toMessageResult(message) {
  return {
    id: message._id,
    conversationId: message.conversation,
    sender: message.sender,
    text: message.text,
    read: message.read,
    isSystem: message.isSystem || false,
    createdAt: message.createdAt,
  };
}

async function handleGET(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return error("A valid conversationId query parameter is required", 400);
    }

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const conversation = await Conversation.findById(conversationId).select("participants").lean();
    if (!conversation) {
      return error("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === user.id);
    if (!isParticipant) {
      return error("You are not a participant in this conversation", 403);
    }

    const filter = { conversation: conversationId };

    // Chronological order (oldest first) — matches the message thread the
    // Message model's compound index (conversation, createdAt) is built for.
    const [messages, total] = await Promise.all([
      Message.find(filter)
        .select(MESSAGE_SELECT)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    return success({
      items: messages.map(toMessageResult),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get messages error:", err);
    return error("Something went wrong while fetching messages", 500);
  }
}

export const GET = withRequestLogging(handleGET, { route: "/api/chat/messages" });

async function handlePOST(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const limited = await rateLimitOrError({
      key: `chat-messages:user:${user.id}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (limited) return limited;

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

    const { conversationId, recipientId, itemId, itemType, text } = parsed.data;

    let conversation, newMessage;
    try {
      ({ conversation, message: newMessage } = await createMessage({
        senderId: user.id,
        conversationId,
        recipientId,
        itemId,
        itemType,
        text,
      }));
    } catch (err) {
      if (err instanceof MessageServiceError) return error(err.message, err.status);
      throw err;
    }

    return success(
      toMessageResult({
        _id: newMessage._id,
        conversation: conversation._id,
        sender: newMessage.sender,
        text: newMessage.text,
        read: newMessage.read,
        isSystem: newMessage.isSystem,
        createdAt: newMessage.createdAt,
      }),
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

export const POST = withRequestLogging(handlePOST, { route: "/api/chat/messages" });
