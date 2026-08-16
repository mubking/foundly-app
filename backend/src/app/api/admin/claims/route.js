import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import { escapeRegex } from "@/utils/regex";
import Claim from "@/models/Claim";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import User from "@/models/User";
import { success, error } from "@/lib/response";

const CLAIMANT_SELECT = "firstName lastName email avatar isVerified";
const ITEM_SELECT = "title images status category location dateLost dateFound owner";
const OWNER_SELECT = "firstName lastName email";

const STATUS_ENUM = ["pending", "approved", "rejected"];

function parseDateParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseBoolParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw !== null) return "invalid";
  return null;
}

function toClaimResult(claim) {
  const item = claim.item;
  return {
    id: claim._id,
    status: claim.status,
    message: claim.message,
    reward: claim.reward ?? null,
    proofImage: claim.proofImage ?? null,
    createdAt: claim.createdAt,
    claimant: claim.claimant
      ? {
          id: claim.claimant._id,
          firstName: claim.claimant.firstName,
          lastName: claim.claimant.lastName,
          email: claim.claimant.email,
          avatar: claim.claimant.avatar,
          isVerified: claim.claimant.isVerified,
        }
      : null,
    item: item
      ? {
          id: item._id,
          title: item.title,
          images: item.images,
          status: item.status,
          category: item.category,
          location: item.location,
          type: claim.itemType === "LostItem" ? "lost" : "found",
          owner: item.owner
            ? { id: item.owner._id, firstName: item.owner.firstName, lastName: item.owner.lastName, email: item.owner.email }
            : null,
        }
      : null,
  };
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

    const status = searchParams.get("status")?.trim() || "";
    if (status && !STATUS_ENUM.includes(status)) {
      return error(`Invalid "status" — must be one of: ${STATUS_ENUM.join(", ")}`, 400);
    }

    const claimant = searchParams.get("claimant")?.trim() || "";
    if (claimant && !mongoose.Types.ObjectId.isValid(claimant)) {
      return error("Invalid claimant ID", 400);
    }

    const item = searchParams.get("item")?.trim() || "";
    if (item && !mongoose.Types.ObjectId.isValid(item)) {
      return error("Invalid item ID", 400);
    }

    const owner = searchParams.get("owner")?.trim() || "";
    if (owner && !mongoose.Types.ObjectId.isValid(owner)) {
      return error("Invalid owner ID", 400);
    }

    const dateFrom = parseDateParam(searchParams, "dateFrom");
    const dateTo = parseDateParam(searchParams, "dateTo");

    const evidence = parseBoolParam(searchParams, "evidence");
    if (evidence === "invalid") {
      return error('Invalid "evidence" — must be one of: true, false', 400);
    }

    const q = searchParams.get("q")?.trim() || "";

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = {};
    if (status) filter.status = status;
    if (claimant) filter.claimant = claimant;
    if (item) filter.item = item;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }
    if (evidence === true) filter.proofImage = { $exists: true, $ne: null };
    if (evidence === false) filter.$or = [{ proofImage: { $exists: false } }, { proofImage: null }];

    // Claims aren't linked back to the item's owner directly — only q/owner
    // searches need to resolve item ids first, same $or-across-both-item-types
    // shape claims/mine/route.js already uses for "which items does this user
    // own".
    if (owner) {
      const [ownedLost, ownedFound] = await Promise.all([
        LostItem.find({ owner }).select("_id").lean(),
        FoundItem.find({ owner }).select("_id").lean(),
      ]);
      const ownerFilter = {
        $or: [
          { itemType: "LostItem", item: { $in: ownedLost.map((i) => i._id) } },
          { itemType: "FoundItem", item: { $in: ownedFound.map((i) => i._id) } },
        ],
      };
      Object.assign(filter, ownerFilter);
    }

    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      const [matchingUsers, matchingLost, matchingFound] = await Promise.all([
        User.find({ $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }] })
          .select("_id")
          .lean(),
        LostItem.find({ title: pattern }).select("_id").lean(),
        FoundItem.find({ title: pattern }).select("_id").lean(),
      ]);
      filter.$or = [
        ...(filter.$or || []),
        { claimant: { $in: matchingUsers.map((u) => u._id) } },
        { itemType: "LostItem", item: { $in: matchingLost.map((i) => i._id) } },
        { itemType: "FoundItem", item: { $in: matchingFound.map((i) => i._id) } },
      ];
    }

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate({ path: "claimant", select: CLAIMANT_SELECT })
        .populate({ path: "item", select: ITEM_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
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
    console.error("Get admin claims error:", err);
    return error("Something went wrong while fetching claims", 500);
  }
}
