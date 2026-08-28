import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Claim from "@/models/Claim";
// Not used directly, but Claim.claimant only stores a ref: "User" string —
// Mongoose needs the actual User schema registered in this module's scope
// before .populate("claimant") can resolve it.
import "@/models/User";
import { success, error } from "@/lib/response";

function toClaimResult(claim) {
  const claimantInactive = Boolean(claim.claimant && claim.claimant.isActive === false);
  return {
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
    },
    item: {
      id: claim.item?._id,
      title: claim.item?.title,
      type: claim.itemType === "LostItem" ? "lost" : "found",
    },
  };
}

export async function GET(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    // Claims aren't linked back to their owner directly — only to the
    // item they were made against. So first find every item this user
    // owns (in both collections), then find claims made against those.
    const [ownedLostItems, ownedFoundItems] = await Promise.all([
      LostItem.find({ owner: user.id }).select("_id").lean(),
      FoundItem.find({ owner: user.id }).select("_id").lean(),
    ]);

    const filter = {
      $or: [
        { itemType: "LostItem", item: { $in: ownedLostItems.map((i) => i._id) } },
        { itemType: "FoundItem", item: { $in: ownedFoundItems.map((i) => i._id) } },
      ],
    };

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate({ path: "claimant", select: "firstName lastName isActive" })
        .populate({ path: "item", select: "title" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Claim.countDocuments(filter),
    ]);

    return success({
      items: claims.map(toClaimResult),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get my claims error:", err);
    return error("Something went wrong while fetching claims", 500);
  }
}
