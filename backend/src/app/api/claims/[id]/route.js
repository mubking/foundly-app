import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import Claim from "@/models/Claim";
// Not used directly, but Claim.claimant only stores a ref: "User" string —
// Mongoose needs the actual User schema registered in this module's scope
// before .populate("claimant") can resolve it. Same reasoning for
// LostItem/FoundItem and Claim.item's polymorphic refPath.
import "@/models/User";
import "@/models/LostItem";
import "@/models/FoundItem";
import { success, error } from "@/lib/response";

// Backs the Claim Details screen: item summary, claimant identity/verification,
// the claim message/evidence/reward, and metadata — everything that screen
// needs in one request instead of a second GET /api/items/:id round trip.
export async function GET(request, context) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid claim ID", 400);
    }

    await connectDB();

    const claim = await Claim.findById(id)
      .populate({ path: "claimant", select: "firstName lastName avatar isVerified isActive" })
      .populate({ path: "item", select: "title images location dateLost dateFound status reward owner" })
      .lean();

    if (!claim || !claim.item) {
      return error("Claim not found", 404);
    }

    // Same review authorization as PATCH /api/claims/:id/status: only the
    // item's owner may see how someone else is trying to prove ownership.
    if (claim.item.owner.toString() !== user.id) {
      return error("You are not allowed to view this claim", 403);
    }

    // Option B (account deactivation): a deactivated claimant still has a
    // retained document, but their identity must not be surfaced — show a
    // neutral "Deleted User" with no avatar.
    const claimantInactive = Boolean(claim.claimant && claim.claimant.isActive === false);

    return success({
      id: claim._id,
      status: claim.status,
      message: claim.message,
      reward: claim.reward ?? null,
      proofImage: claim.proofImage ?? null,
      createdAt: claim.createdAt,
      claimant: {
        id: claim.claimant?._id,
        firstName: claimantInactive ? "Deleted" : claim.claimant?.firstName,
        lastName: claimantInactive ? "User" : claim.claimant?.lastName,
        avatar: claimantInactive ? null : claim.claimant?.avatar ?? null,
        isVerified: claimantInactive ? false : claim.claimant?.isVerified ?? false,
      },
      item: {
        id: claim.item._id,
        title: claim.item.title,
        type: claim.itemType === "LostItem" ? "lost" : "found",
        images: claim.item.images,
        location: claim.item.location,
        date: claim.item.dateLost || claim.item.dateFound,
        status: claim.item.status,
        // Only LostItem has a reward field — undefined on a FoundItem.
        reward: claim.item.reward ?? null,
      },
    });
  } catch (err) {
    console.error("Get claim error:", err);
    return error("Something went wrong while fetching the claim", 500);
  }
}
