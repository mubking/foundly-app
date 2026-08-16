import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { adminReviewClaimSchema } from "@/validations/moderation.validation";
import Claim from "@/models/Claim";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";
import { applyClaimReview } from "@/services/claim.service";

const ITEM_MODELS = { LostItem, FoundItem };

export async function POST(request, context) {
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
      return error("Invalid claim ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = adminReviewClaimSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const claim = await Claim.findById(id);
    if (!claim) {
      return error("Claim not found", 404);
    }

    if (claim.status !== "pending") {
      return error("Claim has already been reviewed", 409);
    }

    const ItemModel = ITEM_MODELS[claim.itemType];
    const item = await ItemModel.findById(claim.item).select("owner title").lean();
    if (!item) {
      return error("Item not found", 404);
    }

    const { status, reason } = parsed.data;

    // Reuses the exact same approve/reject side-effect chain the item
    // owner's own review endpoint (PATCH /api/claims/:id/status) uses —
    // bulk-rejecting siblings, resolving matches, notifying everyone,
    // posting the conversation system message — so an admin decision is
    // never a second, diverging code path.
    await applyClaimReview({ claim, item, ItemModel, status });

    await ModerationAction.create({
      admin: user.id,
      action: status === "approved" ? "approve_claim" : "reject_claim",
      targetType: "Claim",
      targetId: claim._id,
      reason: reason || null,
      ip: getRequestIp(request),
      before: { status: "pending" },
      after: { status },
    });

    return success(undefined, status === "approved" ? "Claim approved successfully" : "Claim rejected successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Admin moderate claim error:", err);
    return error("Something went wrong while reviewing this claim", 500);
  }
}
