import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import Match from "@/models/Match";
// Not used directly, but Match.lostItem/foundItem only store `ref:`
// strings, and each item's `owner` a nested one — Mongoose needs every
// schema registered in this module's scope before .populate() can resolve
// them.
import "@/models/LostItem";
import "@/models/FoundItem";
import "@/models/User";
import { success, error } from "@/lib/response";
import { VERY_LIKELY_THRESHOLD, POSSIBLE_THRESHOLD } from "@/services/matching.service";

const ITEM_SELECT = "title description images status category location dateLost dateFound reward owner";
const OWNER_SELECT = "firstName lastName email avatar isVerified";

function band(score) {
  if (score >= VERY_LIKELY_THRESHOLD) return "very_likely";
  if (score >= POSSIBLE_THRESHOLD) return "possible";
  return "weak";
}

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
      return error("Invalid match ID", 400);
    }

    await connectDB();

    const match = await Match.findById(id)
      .populate({ path: "lostItem", select: ITEM_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
      .populate({ path: "foundItem", select: ITEM_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
      .lean();

    if (!match) {
      return error("Match not found", 404);
    }

    return success({
      id: match._id,
      score: match.score,
      band: band(match.score),
      reasons: match.reasons,
      status: match.status,
      notifiedAt: match.notifiedAt,
      createdAt: match.createdAt,
      lostItem: match.lostItem,
      foundItem: match.foundItem,
    });
  } catch (err) {
    console.error("Get admin match error:", err);
    return error("Something went wrong while fetching this match", 500);
  }
}
