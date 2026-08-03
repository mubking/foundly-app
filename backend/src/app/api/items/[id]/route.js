import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
// Not used directly, but LostItem/FoundItem's `owner` field only stores a
// ref: "User" string — Mongoose needs the actual User schema registered
// in this module's scope before .populate("owner") can resolve it.
import "@/models/User";
import { success, error } from "@/lib/response";
import { getAuthUser, AuthError } from "@/lib/auth";
import { updateLostItemSchema, updateFoundItemSchema } from "@/validations/update-item.validation";

// Owner is populated with only these fields — never email, password, or
// anything else from the User document.
const OWNER_SELECT = "firstName lastName";
// Strip Mongoose's internal version key from the item document itself.
const ITEM_SELECT = "-__v";

export async function GET(request, context) {
  try {
const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid item ID", 400);
    }

    await connectDB();

    // An ObjectId can only ever exist in one of the two collections, so
    // both lookups can safely run concurrently instead of checking Lost,
    // then only checking Found if that missed.
    const [lostItem, foundItem] = await Promise.all([
      LostItem.findById(id).select(ITEM_SELECT).populate({ path: "owner", select: OWNER_SELECT }).lean(),
      FoundItem.findById(id).select(ITEM_SELECT).populate({ path: "owner", select: OWNER_SELECT }).lean(),
    ]);

   const item = lostItem || foundItem;

    if (!item) {
      return error("Item not found", 404);
    }

    return success({
      ...item,
      type: lostItem ? "lost" : "found",
    });
  } catch (err) {
    return error("An unexpected error occurred", 500);
  }
}

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
      return error("Invalid item ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    await connectDB();

    // Same "check both collections concurrently" approach as GET — an
    // ObjectId can only ever live in one of them. Only `owner` is
    // projected here since that's all this existence/ownership check
    // needs; the full document is fetched again after the update below.
    const [lostOwner, foundOwner] = await Promise.all([
      LostItem.findById(id).select("owner").lean(),
      FoundItem.findById(id).select("owner").lean(),
    ]);

    const existing = lostOwner || foundOwner;
    if (!existing) {
      return error("Item not found", 404);
    }

    if (existing.owner.toString() !== user.id) {
      return error("You are not allowed to update this item", 403);
    }

    const type = lostOwner ? "lost" : "found";
    const Model = lostOwner ? LostItem : FoundItem;
    const schema = lostOwner ? updateLostItemSchema : updateFoundItemSchema;

    // Zod strips any keys the schema doesn't declare — _id, owner,
    // createdAt, updatedAt (and, for FoundItem, reward) can never survive
    // into parsed.data no matter what the client sends.
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    if (Object.keys(parsed.data).length === 0) {
      return error("No valid fields provided to update", 400);
    }

    // One shared update path for both models — Model/schema/type were
    // already resolved above, so nothing below branches on lost vs found.
    const updated = await Model.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    )
      .select(ITEM_SELECT)
      .lean();

    return success({ ...updated, type }, "Item updated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Update item error:", err);
    return error("Something went wrong while updating the item", 500);
  }
}

export async function DELETE(request, context) {
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
      return error("Invalid item ID", 400);
    }

    await connectDB();

    // Same ownership-check pattern as PATCH: check both collections
    // concurrently, projecting only `owner` since that's all this needs.
    const [lostOwner, foundOwner] = await Promise.all([
      LostItem.findById(id).select("owner").lean(),
      FoundItem.findById(id).select("owner").lean(),
    ]);

    const existing = lostOwner || foundOwner;
    if (!existing) {
      return error("Item not found", 404);
    }

    if (existing.owner.toString() !== user.id) {
      return error("You are not allowed to delete this item", 403);
    }

    // One shared delete path for both models.
    const Model = lostOwner ? LostItem : FoundItem;
    await Model.findByIdAndDelete(id);

    return success(undefined, "Item deleted successfully");
  } catch (err) {
    console.error("Delete item error:", err);
    return error("Something went wrong while deleting the item", 500);
  }
}

