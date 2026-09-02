import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import Conversation from "@/models/Conversation";
// Not used directly, but Conversation.participants/lastMessage/item only
// store refs — Mongoose needs the User/Message/LostItem/FoundItem schemas
// registered in this module's scope before .populate() can resolve them.
// item's polymorphic refPath (see models/Conversation.js) resolves against
// whichever of LostItem/FoundItem this document's own itemType names.
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
} from "@/services/conversation.service";

export async function GET(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
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
        .populate({ path: "item", select: ITEM_SELECT })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    const [unreadMap, blockState] = await Promise.all([
      getUnreadCounts(
        conversations.map((c) => c._id),
        user.id
      ),
      getBlockStateForUser(user.id),
    ]);

    return success({
      items: conversations.map((c) => toConversationResult(c, user.id, unreadMap, blockState)),
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
