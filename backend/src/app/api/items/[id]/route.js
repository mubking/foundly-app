import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
// Not used directly, but LostItem/FoundItem's `owner` field only stores a
// ref: "User" string — Mongoose needs the actual User schema registered
// in this module's scope before .populate("owner") can resolve it.
import "@/models/User";
import { success, error } from "@/lib/response";
import { getAuthUser, requireActiveUser, AuthError } from "@/lib/auth";
import { updateLostItemSchema, updateFoundItemSchema } from "@/validations/update-item.validation";
import { matchLostItem, matchFoundItem } from "@/services/matching.service";

// Owner is populated with only these fields — never email, password, or
// anything else from the User document. `isActive` is selected only so the
// public GET can hide listings owned by deactivated accounts; it is
// stripped from the response below.
const OWNER_SELECT = "firstName lastName isActive";
// Strip Mongoose's internal version key from the item document itself.
const ITEM_SELECT = "-__v";

// Moderation/soft-delete states that must not be served on the public item
// endpoint to anyone but the item's own owner. `status` is server-controlled
// (set by the admin moderate route or by account deletion — never by the
// owner through either create or update schemas), so checking it here is a
// genuine state gate, not a trust of client input.
const MODERATION_HIDDEN_STATUSES = new Set(["suspended", "removed"]);

/** Best-effort optional auth: the viewer's user id, or null when unauthenticated/anonymous. */
function getOptionalViewerId(request) {
  try {
    return getAuthUser(request).id;
  } catch (err) {
    if (!(err instanceof AuthError)) throw err;
    return null;
  }
}

export async function GET(request, context) {
  try {
const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid item ID", 400);
    }

    await connectDB();

    // Optionally authenticated: an owner may still open their own
    // suspended/removed listing (e.g. from "My Items") so the moderation
    // state below doesn't break that screen, but an anonymous/other viewer
    // never may.
    const viewerId = getOptionalViewerId(request);

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

    // Option B (account deactivation): a listing owned by a deactivated
    // account is treated as gone on the public detail endpoint — the
    // document is retained, but it must not be served.
    if (item.owner && item.owner.isActive === false) {
      return error("Item not found", 404);
    }

    // Moderation parity: an admin-suspended/removed listing must not be
    // reachable by direct URL either — search/feed already exclude these
    // states, so the detail endpoint was the remaining way a removed or
    // under-review listing could be pulled up. The owner keeps access so
    // "My Items" → detail (and edit prefill) keeps working for them.
    if (MODERATION_HIDDEN_STATUSES.has(item.status)) {
      const ownerId = item.owner && (item.owner._id || item.owner.id || "").toString();
      if (ownerId !== viewerId) {
        return error("Item not found", 404);
      }
    }

    if (item.owner) {
      delete item.owner.isActive;
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
      user = await requireActiveUser(request);
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
    // ObjectId can only ever live in one of them. Only `owner` + `status`
    // are projected here: owner for this existence/ownership check, status
    // for the moderation gate below; the full document is fetched again
    // after the update below.
    const [lostOwner, foundOwner] = await Promise.all([
      LostItem.findById(id).select("owner status").lean(),
      FoundItem.findById(id).select("owner status").lean(),
    ]);

    const existing = lostOwner || foundOwner;
    if (!existing) {
      return error("Item not found", 404);
    }

    if (existing.owner.toString() !== user.id) {
      return error("You are not allowed to update this item", 403);
    }

    // Moderation gate: an admin-suspended/removed listing must not be
    // editable by its owner. Without this, the owner could trivially
    // reverse a moderation decision (e.g. PATCH {status: "open"} on a
    // removed listing, which the update schema otherwise permits), so the
    // only way to restore is the admin "restore" action.
    if (MODERATION_HIDDEN_STATUSES.has(existing.status)) {
      return error("This item has been hidden and can't be edited", 403);
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

    // Fire-and-forget — an edit can change title/category/location/etc.
    // enough to affect matching, so this rescans the same as a fresh
    // create (Phase 2: "an item is edited"). Never allowed to fail or
    // delay a successful update.
    if (type === "lost") matchLostItem(updated);
    else matchFoundItem(updated);

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
      user = await requireActiveUser(request);
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

