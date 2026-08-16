import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { updateLostItemSchema, updateFoundItemSchema } from "@/validations/update-item.validation";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Claim from "@/models/Claim";
import Report from "@/models/Report";
import ModerationAction from "@/models/ModerationAction";
// Not used directly, but LostItem/FoundItem's `owner` field only stores a
// ref: "User" string — Mongoose needs the actual User schema registered in
// this module's scope before .populate("owner") can resolve it.
import "@/models/User";
import { success, error } from "@/lib/response";
import { matchLostItem, matchFoundItem } from "@/services/matching.service";

const TYPE_LOOKUP = {
  lost: { Model: LostItem, modelName: "LostItem", updateSchema: updateLostItemSchema, matcher: matchLostItem },
  found: { Model: FoundItem, modelName: "FoundItem", updateSchema: updateFoundItemSchema, matcher: matchFoundItem },
};

const OWNER_SELECT = "firstName lastName email avatar isVerified isActive banned";

function resolveType(type) {
  const lookup = TYPE_LOOKUP[type];
  if (!lookup) return null;
  return lookup;
}

// Backs the admin listing detail screen: the item, its owner, every report
// filed against it, and every claim filed on it — everything "View reports"
// / "View claims" from the Listings section needs in one request.
export async function GET(request, context) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { type, id } = await context.params;
    const lookup = resolveType(type);
    if (!lookup) {
      return error('Invalid listing "type" — must be one of: lost, found', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid listing ID", 400);
    }

    await connectDB();

    const { Model, modelName } = lookup;

    const item = await Model.findById(id).populate({ path: "owner", select: OWNER_SELECT }).lean();
    if (!item) {
      return error("Listing not found", 404);
    }

    const [reports, claims] = await Promise.all([
      Report.find({ targetType: modelName, target: id })
        .populate({ path: "reporter", select: "firstName lastName email" })
        .sort({ createdAt: -1 })
        .lean(),
      Claim.find({ item: id, itemType: modelName })
        .populate({ path: "claimant", select: "firstName lastName email isVerified" })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return success({
      item: { ...item, type },
      reports,
      claims,
    });
  } catch (err) {
    console.error("Get admin listing detail error:", err);
    return error("Something went wrong while fetching this listing", 500);
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

    const { type, id } = await context.params;
    const lookup = resolveType(type);
    if (!lookup) {
      return error('Invalid listing "type" — must be one of: lost, found', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid listing ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const { Model, modelName, updateSchema, matcher } = lookup;

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    if (Object.keys(parsed.data).length === 0) {
      return error("No valid fields provided to update", 400);
    }

    await connectDB();

    const changedFields = Object.keys(parsed.data);
    const existing = await Model.findById(id).select(changedFields.join(" ")).lean();
    if (!existing) {
      return error("Listing not found", 404);
    }

    const before = Object.fromEntries(changedFields.map((field) => [field, existing[field]]));

    const updated = await Model.findByIdAndUpdate(id, { $set: parsed.data }, { new: true, runValidators: true })
      .select("-__v")
      .lean();

    await ModerationAction.create({
      admin: user.id,
      action: "edit_listing",
      targetType: modelName,
      targetId: updated._id,
      ip: getRequestIp(request),
      before,
      after: parsed.data,
    });

    // Fire-and-forget — an edit can change title/category/location/etc.
    // enough to affect matching, same as the owner's own PATCH /api/items/[id].
    matcher(updated);

    return success({ ...updated, type }, "Listing updated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Update admin listing error:", err);
    return error("Something went wrong while updating this listing", 500);
  }
}
