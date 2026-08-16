import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import SpamFlag from "@/models/SpamFlag";
// Not used directly, but User must be registered before .populate("user") resolves.
import "@/models/User";
import { success, error } from "@/lib/response";
import { SEVERITY } from "@/services/spam-detection.service";

const VALID_STATUSES = ["open", "reviewed"];
const VALID_RESOLUTIONS = ["ignored", "actioned"];
const VALID_TYPES = [
  "duplicate_posts",
  "too_many_posts",
  "repeated_messages",
  "mass_messaging",
  "repeated_failed_claims",
  "repeated_reports",
];

// A user is "high risk" if they currently have 2+ still-open flags — a
// real, derivable signal (not a fabricated score) since spam-detection.
// service.js's raiseFlag() already dedupes to at most one open flag per
// (user, type), so 2+ means at least two distinct kinds of suspicious
// behavior were independently detected.
const HIGH_RISK_OPEN_FLAG_COUNT = 2;

export async function GET(request) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status")?.trim() || "";
    if (status && !VALID_STATUSES.includes(status)) {
      return error(`Invalid "status" — must be one of: ${VALID_STATUSES.join(", ")}`, 400);
    }

    const resolution = searchParams.get("resolution")?.trim() || "";
    if (resolution && !VALID_RESOLUTIONS.includes(resolution)) {
      return error(`Invalid "resolution" — must be one of: ${VALID_RESOLUTIONS.join(", ")}`, 400);
    }

    const type = searchParams.get("type")?.trim() || "";
    if (type && !VALID_TYPES.includes(type)) {
      return error(`Invalid "type" — must be one of: ${VALID_TYPES.join(", ")}`, 400);
    }

    const userId = searchParams.get("user")?.trim() || "";
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return error("Invalid user ID", 400);
    }

    const highRisk = searchParams.get("highRisk") === "true";

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = {};
    if (status) filter.status = status;
    if (resolution) filter.resolution = resolution;
    if (type) filter.type = type;
    if (userId) filter.user = userId;

    if (highRisk) {
      const riskyUsers = await SpamFlag.aggregate([
        { $match: { status: "open" } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
        { $match: { count: { $gte: HIGH_RISK_OPEN_FLAG_COUNT } } },
      ]);
      filter.user = { $in: riskyUsers.map((r) => r._id) };
    }

    const [items, total] = await Promise.all([
      SpamFlag.find(filter)
        .populate({ path: "user", select: "firstName lastName email isActive banned" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SpamFlag.countDocuments(filter),
    ]);

    return success({
      items: items.map((item) => ({
        id: item._id,
        user: item.user,
        type: item.type,
        detail: item.detail,
        status: item.status,
        resolution: item.resolution,
        severity: SEVERITY[item.type] || "low",
        createdAt: item.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get admin spam flags error:", err);
    return error("Something went wrong while fetching spam flags", 500);
  }
}
