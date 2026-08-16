import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { reviewSpamFlagSchema } from "@/validations/moderation.validation";
import SpamFlag from "@/models/SpamFlag";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";
import { SEVERITY } from "@/services/spam-detection.service";

const USER_SELECT = "firstName lastName email avatar isVerified isActive banned createdAt";
const RECENT_LISTINGS_LIMIT = 10;

export async function GET(request, context) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid spam flag ID", 400);
    }

    await connectDB();

    const flag = await SpamFlag.findById(id).populate({ path: "user", select: USER_SELECT }).lean();
    if (!flag) {
      return error("Spam flag not found", 404);
    }

    // No listing reference is stored on SpamFlag (it's fundamentally
    // user-scoped, and several flag types — mass_messaging,
    // repeated_reports — aren't about any single listing at all) — so the
    // "Suspend listing"/"Remove listing" actions need the user's recent
    // listings resolved live here instead.
    const [lostItems, foundItems, openFlagCount] = await Promise.all([
      LostItem.find({ owner: flag.user?._id }).select("title status createdAt").sort({ createdAt: -1 }).limit(RECENT_LISTINGS_LIMIT).lean(),
      FoundItem.find({ owner: flag.user?._id }).select("title status createdAt").sort({ createdAt: -1 }).limit(RECENT_LISTINGS_LIMIT).lean(),
      SpamFlag.countDocuments({ user: flag.user?._id, status: "open" }),
    ]);

    const listings = [
      ...lostItems.map((i) => ({ id: i._id, title: i.title, status: i.status, createdAt: i.createdAt, type: "lost" })),
      ...foundItems.map((i) => ({ id: i._id, title: i.title, status: i.status, createdAt: i.createdAt, type: "found" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return success({
      id: flag._id,
      user: flag.user,
      type: flag.type,
      detail: flag.detail,
      status: flag.status,
      resolution: flag.resolution,
      severity: SEVERITY[flag.type] || "low",
      createdAt: flag.createdAt,
      openFlagCount,
      recentListings: listings,
    });
  } catch (err) {
    console.error("Get admin spam flag error:", err);
    return error("Something went wrong while fetching this spam flag", 500);
  }
}

export async function PATCH(request, context) {
  try {
    let user;
    try {
      user = await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid spam flag ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = reviewSpamFlagSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const flag = await SpamFlag.findById(id);
    if (!flag) {
      return error("Spam flag not found", 404);
    }

    const { resolution, reason } = parsed.data;
    const beforeStatus = flag.status;

    flag.status = "reviewed";
    flag.resolution = resolution;
    await flag.save();

    await ModerationAction.create({
      admin: user.id,
      action: resolution === "ignored" ? "ignore_spam_flag" : "action_spam_flag",
      targetType: "SpamFlag",
      targetId: flag._id,
      reason: reason || null,
      ip: getRequestIp(request),
      before: { status: beforeStatus, resolution: null },
      after: { status: "reviewed", resolution },
    });

    return success(undefined, "Spam flag reviewed successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Review spam flag error:", err);
    return error("Something went wrong while reviewing this spam flag", 500);
  }
}
