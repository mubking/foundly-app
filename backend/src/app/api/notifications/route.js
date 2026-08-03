import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import Notification from "@/models/Notification";
import { success, error } from "@/lib/response";

// Explicit field list — never selects recipient/__v, and updatedAt is
// simply not requested. _id comes back regardless (renamed to `id` in
// the mapper below), which is the only identifying field we return.
const NOTIFICATION_SELECT = "title message type isRead createdAt";

function toNotificationResult(notification) {
  return {
    id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
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

    const filter = { recipient: user.id };
    if (searchParams.get("unread") === "true") {
      filter.isRead = false;
    }

    await connectDB();

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .select(NOTIFICATION_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return success({
      items: notifications.map(toNotificationResult),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    return error("Something went wrong while fetching notifications", 500);
  }
}
