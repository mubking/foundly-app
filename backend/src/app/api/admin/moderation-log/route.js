import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import ModerationAction, { MODERATION_ACTIONS } from "@/models/ModerationAction";
// Not used directly, but every possible targetType/admin must be registered
// before .populate() can resolve them.
import "@/models/User";
import "@/models/LostItem";
import "@/models/FoundItem";
import "@/models/Report";
import "@/models/VerificationRequest";
import "@/models/Claim";
import "@/models/Match";
import "@/models/SpamFlag";
import { success, error } from "@/lib/response";

const VALID_TARGET_TYPES = ["User", "LostItem", "FoundItem", "Report", "VerificationRequest", "Claim", "Match", "SpamFlag"];

function parseDateParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function GET(request) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);

    const targetType = searchParams.get("targetType")?.trim() || "";
    if (targetType && !VALID_TARGET_TYPES.includes(targetType)) {
      return error(`Invalid "targetType" — must be one of: ${VALID_TARGET_TYPES.join(", ")}`, 400);
    }

    const targetId = searchParams.get("targetId")?.trim() || "";
    if (targetId && !mongoose.Types.ObjectId.isValid(targetId)) {
      return error("Invalid targetId", 400);
    }

    const adminId = searchParams.get("admin")?.trim() || "";
    if (adminId && !mongoose.Types.ObjectId.isValid(adminId)) {
      return error("Invalid admin ID", 400);
    }

    const action = searchParams.get("action")?.trim() || "";
    if (action && !MODERATION_ACTIONS.includes(action)) {
      return error(`Invalid "action" — must be one of: ${MODERATION_ACTIONS.join(", ")}`, 400);
    }

    const dateFrom = parseDateParam(searchParams, "dateFrom");
    const dateTo = parseDateParam(searchParams, "dateTo");

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (adminId) filter.admin = adminId;
    if (action) filter.action = action;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }

    const [items, total] = await Promise.all([
      ModerationAction.find(filter)
        .populate({ path: "admin", select: "firstName lastName email" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ModerationAction.countDocuments(filter),
    ]);

    return success({
      items: items.map((item) => ({
        id: item._id,
        admin: item.admin,
        action: item.action,
        targetType: item.targetType,
        targetId: item.targetId,
        reason: item.reason,
        ip: item.ip,
        createdAt: item.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get moderation log error:", err);
    return error("Something went wrong while fetching the moderation log", 500);
  }
}
