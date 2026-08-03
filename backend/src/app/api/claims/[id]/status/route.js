import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { reviewClaimSchema } from "@/validations/claim.validation";
import Claim from "@/models/Claim";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import { success, error } from "@/lib/response";

// Maps Claim.itemType (a model-name string, required by the refPath on
// Claim.item) back to the actual model, so we can look up who owns the
// item this claim refers to, and — on approval — update its status.
const ITEM_MODELS = { LostItem, FoundItem };

export async function PATCH(request, context) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid claim ID", 400);
    }

    await connectDB();

    // No populate — the claim's raw item/itemType/status fields are all
    // this route needs.
    const claim = await Claim.findById(id);
    if (!claim) {
      return error("Claim not found", 404);
    }

    const ItemModel = ITEM_MODELS[claim.itemType];
    const item = await ItemModel.findById(claim.item).select("owner").lean();
    if (!item) {
      return error("Item not found", 404);
    }

    if (item.owner.toString() !== user.id) {
      return error("You are not allowed to review this claim", 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid request body", 400);
    }

    const parsed = reviewClaimSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid request body";
      return error(message, 400);
    }

    const { status } = parsed.data;

    if (claim.status !== "pending") {
      return error("Claim has already been reviewed", 409);
    }

    if (status === "approved") {
      claim.status = "approved";

      await Promise.all([
        claim.save(),
        ItemModel.findByIdAndUpdate(claim.item, { status: "claimed" }, { runValidators: true }),
      ]);

      return success(undefined, "Claim approved successfully");
    }

    claim.status = "rejected";
    await claim.save();

    return success(undefined, "Claim rejected successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid request body";
      return error(message, 400);
    }

    console.error("Review claim error:", err);
    return error("Something went wrong while reviewing the claim", 500);
  }
}
