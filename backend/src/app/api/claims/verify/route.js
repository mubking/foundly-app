import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { verifyClaimSchema } from "@/validations/claim.validation";
import Claim from "@/models/Claim";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import { success, error } from "@/lib/response";

// Maps Claim.itemType (a model-name string, required by the refPath on
// Claim.item) back to the actual model, so we can look up who owns the
// item this claim refers to, and — on approval — update its status.
const ITEM_MODELS = { LostItem, FoundItem };

export async function PATCH(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid request body", 400);
    }

    const parsed = verifyClaimSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid request body";
      return error(message, 400);
    }

    const { claimId, action } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return error("Invalid claim ID", 400);
    }

    await connectDB();

    // The item lookup depends on the claim's own itemType/item fields, so
    // these two reads are necessarily sequential — there's nothing to
    // parallelize with Promise.all until after this point.
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return error("Claim not found", 404);
    }

    const ItemModel = ITEM_MODELS[claim.itemType];
    const item = await ItemModel.findById(claim.item).select("owner").lean();

    if (!item) {
      return error("Item not found", 404);
    }

    if (item.owner.toString() !== user.id) {
      return error("You do not own this item", 403);
    }

    if (action === "approve") {
      claim.status = "approved";

      // Three independent writes — none depends on another's result — so
      // they run concurrently instead of as three sequential round trips.
      await Promise.all([
        claim.save(),
        ItemModel.findByIdAndUpdate(claim.item, { status: "claimed" }, { runValidators: true }),
        Claim.updateMany(
          { item: claim.item, itemType: claim.itemType, _id: { $ne: claim._id }, status: "pending" },
          { status: "rejected" }
        ),
      ]);
    } else {
      claim.status = "rejected";
      await claim.save();
    }

    return success(
      {
        claimId: claim._id,
        status: claim.status,
      },
      "Claim updated successfully"
    );
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid request body";
      return error(message, 400);
    }

    console.error("Verify claim error:", err);
    return error("Something went wrong while verifying the claim", 500);
  }
}
