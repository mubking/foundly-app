import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { moderateListingSchema } from "@/validations/moderation.validation";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";
import { notify } from "@/lib/notifications";

// Maps the public "lost"/"found" wording to the actual model to query and
// the model-name string ModerationAction.targetType needs — same lookup
// shape as claims/create's ITEM_LOOKUP.
const TYPE_LOOKUP = {
  lost: { Model: LostItem, modelName: "LostItem" },
  found: { Model: FoundItem, modelName: "FoundItem" },
};

const ACTION_TO_LOG = {
  suspend: "suspend_listing",
  delete: "delete_listing",
  restore: "restore_listing",
  feature: "feature_listing",
  unfeature: "unfeature_listing",
};

// Actions that notify the owner — feature/unfeature are cosmetic promotions,
// not moderation against the owner, so they don't generate a notification.
const NOTIFIES_OWNER = new Set(["suspend", "delete", "restore"]);

function buildOwnerNotification(action, item, reason) {
  if (action === "restore") {
    return {
      title: "Your listing was restored",
      message: `Your listing "${item.title}" was restored by a moderator and is visible again.`,
      type: "listing_restored",
    };
  }

  return {
    title: "Your listing was removed",
    message: reason
      ? `Your listing "${item.title}" was removed by a moderator: ${reason}`
      : `Your listing "${item.title}" was removed by a moderator.`,
    type: "listing_removed",
  };
}

export async function POST(request, context) {
  try {
    let user;
    try {
      user = await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { type, id } = await context.params;
    const lookup = TYPE_LOOKUP[type];
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

    const parsed = moderateListingSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const { Model, modelName } = lookup;
    const item = await Model.findById(id);
    if (!item) {
      return error("Listing not found", 404);
    }

    const { action, reason } = parsed.data;
    const before = { status: item.status, featured: item.featured };

    // Both suspend/delete are soft — "delete" sets status "removed" rather
    // than a hard Mongo delete — see the schema comment on
    // LostItem/FoundItem.status: Claims/Conversations/Messages/Reports
    // that reference this item would otherwise be orphaned. "restore"
    // reverses either back to "open".
    if (action === "suspend") item.status = "suspended";
    if (action === "delete") item.status = "removed";
    if (action === "restore") item.status = "open";
    if (action === "feature") item.featured = true;
    if (action === "unfeature") item.featured = false;
    await item.save();

    await ModerationAction.create({
      admin: user.id,
      action: ACTION_TO_LOG[action],
      targetType: modelName,
      targetId: item._id,
      reason: reason || null,
      ip: getRequestIp(request),
      before,
      after: { status: item.status, featured: item.featured },
    });

    if (NOTIFIES_OWNER.has(action)) {
      const copy = buildOwnerNotification(action, item, reason);
      await notify({
        recipient: item.owner,
        title: copy.title,
        message: copy.message,
        type: copy.type,
        targetType: modelName,
        targetId: item._id,
      });
    }

    return success(undefined, "Listing moderated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Moderate listing error:", err);
    return error("Something went wrong while moderating this listing", 500);
  }
}
