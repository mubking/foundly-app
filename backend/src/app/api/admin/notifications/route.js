import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import { escapeRegex } from "@/utils/regex";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { success, error } from "@/lib/response";

// Notification.type has no enum (see models/Notification.js) — this maps
// every real `type` string that lib/notifications.js#notify() is actually
// called with today (grepped across the codebase) into the six buckets
// the admin UI filters by. New `type` strings introduced later that don't
// fall into a bucket simply won't match any `category` filter (never
// throws — falls through to "system" instead, see CATEGORY_OF below).
const CATEGORY_TYPES = {
  claims: ["claim_submitted", "claim_approved", "claim_rejected"],
  messages: ["new_message", "claim_reply"],
  matches: ["match"],
  reports: ["user_reported", "listing_reported"],
  verification: [
    "verification_approved",
    "verification_rejected",
    "verification_resubmission_requested",
    "account_verified",
    "account_unverified",
  ],
};

const KNOWN_TYPES = new Set(Object.values(CATEGORY_TYPES).flat());
const VALID_CATEGORIES = [...Object.keys(CATEGORY_TYPES), "system"];

export async function GET(request) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category")?.trim() || "";
    if (category && !VALID_CATEGORIES.includes(category)) {
      return error(`Invalid "category" — must be one of: ${VALID_CATEGORIES.join(", ")}`, 400);
    }

    const recipient = searchParams.get("recipient")?.trim() || "";
    if (recipient && !mongoose.Types.ObjectId.isValid(recipient)) {
      return error("Invalid recipient ID", 400);
    }

    const isRead = searchParams.get("isRead");
    if (isRead !== null && isRead !== "true" && isRead !== "false") {
      return error('Invalid "isRead" — must be one of: true, false', 400);
    }

    const q = searchParams.get("q")?.trim() || "";

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = {};
    if (recipient) filter.recipient = recipient;
    if (isRead !== null) filter.isRead = isRead === "true";
    if (category === "system") {
      filter.type = { $nin: [...KNOWN_TYPES] };
    } else if (category) {
      filter.type = { $in: CATEGORY_TYPES[category] };
    }

    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      const matchingUsers = await User.find({ $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }] })
        .select("_id")
        .lean();
      filter.$or = [{ title: pattern }, { message: pattern }, { recipient: { $in: matchingUsers.map((u) => u._id) } }];
    }

    const [items, total] = await Promise.all([
      Notification.find(filter)
        .populate({ path: "recipient", select: "firstName lastName email" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return success({
      items: items.map((n) => ({
        id: n._id,
        recipient: n.recipient,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        targetType: n.targetType,
        targetId: n.targetId,
        createdAt: n.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get admin notifications error:", err);
    return error("Something went wrong while fetching notifications", 500);
  }
}
