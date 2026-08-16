import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import ModerationAction from "@/models/ModerationAction";
import User from "@/models/User";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Report from "@/models/Report";
import VerificationRequest from "@/models/VerificationRequest";
import Claim from "@/models/Claim";
import Match from "@/models/Match";
import SpamFlag from "@/models/SpamFlag";
import { success, error } from "@/lib/response";

// Best-effort "what does the target look like today" lookup, keyed by
// targetType — a display convenience only, never presented as a
// historical snapshot (that's what `before`/`after` are for).
const TARGET_LOOKUP = {
  User: { Model: User, select: "firstName lastName email role isActive banned" },
  LostItem: { Model: LostItem, select: "title status category" },
  FoundItem: { Model: FoundItem, select: "title status category" },
  Report: { Model: Report, select: "reason status targetType" },
  VerificationRequest: { Model: VerificationRequest, select: "status provider" },
  Claim: { Model: Claim, select: "status message" },
  Match: { Model: Match, select: "status score" },
  SpamFlag: { Model: SpamFlag, select: "type status resolution" },
};

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
      return error("Invalid moderation action ID", 400);
    }

    await connectDB();

    const entry = await ModerationAction.findById(id).populate({ path: "admin", select: "firstName lastName email" }).lean();
    if (!entry) {
      return error("Moderation action not found", 404);
    }

    const lookup = TARGET_LOOKUP[entry.targetType];
    const target = lookup ? await lookup.Model.findById(entry.targetId).select(lookup.select).lean() : null;

    return success({
      id: entry._id,
      admin: entry.admin,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      target,
      reason: entry.reason,
      ip: entry.ip,
      // Only populated on entries written after this field existed — null
      // on older rows, deliberately not backfilled or fabricated.
      before: entry.before ?? null,
      after: entry.after ?? null,
      createdAt: entry.createdAt,
    });
  } catch (err) {
    console.error("Get moderation action error:", err);
    return error("Something went wrong while fetching this moderation action", 500);
  }
}
