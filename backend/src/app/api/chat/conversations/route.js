import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
// Not used directly, but Conversation.participants/lastMessage only store
// refs — Mongoose needs the User/Message schemas registered in this
// module's scope before .populate() can resolve them.
import "@/models/User";
import { success, error } from "@/lib/response";

const PARTICIPANT_SELECT = "firstName lastName avatar";
const LAST_MESSAGE_SELECT = "text sender createdAt read";

function toConversationResult(conversation, currentUserId, unreadCounts) {
  const other = conversation.participants.find((p) => p._id.toString() !== currentUserId);

  return {
    id: conversation._id,
    participant: other
      ? {
          id: other._id,
          firstName: other.firstName,
          lastName: other.lastName,
          avatar: other.avatar,
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

export async function GET(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = { participants: user.id };

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate({ path: "participants", select: PARTICIPANT_SELECT })
        .populate({ path: "lastMessage", select: LAST_MESSAGE_SELECT })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    // Unread = messages in one of these conversations, not sent by the
    // caller, not yet marked read. Computed in one aggregation rather than
    // per-conversation queries.
    const conversationIds = conversations.map((c) => c._id);
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          sender: { $ne: new mongoose.Types.ObjectId(user.id) },
          read: false,
        },
      },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]));

    return success({
      items: conversations.map((c) => toConversationResult(c, user.id, unreadMap)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get conversations error:", err);
    return error("Something went wrong while fetching conversations", 500);
  }
}
