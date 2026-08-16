import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { adminMatchActionSchema } from "@/validations/match.validation";
import Match from "@/models/Match";
// Not used directly, but Match.lostItem/foundItem only store `ref:`
// strings — Mongoose needs both schemas registered in this module's scope
// before .populate() can resolve them.
import "@/models/LostItem";
import "@/models/FoundItem";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";
import { notify } from "@/lib/notifications";

const ACTION_TO_LOG = {
  resolve: "resolve_match",
  dismiss: "dismiss_match",
  renotify: "renotify_match",
};

const ACTION_TO_STATUS = { resolve: "resolved", dismiss: "dismissed" };

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
      return error("Invalid match ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = adminMatchActionSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const match = await Match.findById(id).populate("lostItem").populate("foundItem");
    if (!match) {
      return error("Match not found", 404);
    }
    if (!match.lostItem || !match.foundItem) {
      return error("This match's listing no longer exists", 409);
    }

    const { action, reason } = parsed.data;
    const beforeStatus = match.status;

    if (action === "resolve" || action === "dismiss") {
      match.status = ACTION_TO_STATUS[action];
      await match.save();
    }

    if (action === "renotify") {
      // Same copy/shape matching.service.js#upsertMatch already sends both
      // owners the first time a match crosses the high-confidence
      // threshold — this just resends it on demand, no new notification
      // type invented.
      await Promise.all([
        notify({
          recipient: match.lostItem.owner,
          title: "Possible match found",
          message: `We found a possible match for your lost ${match.lostItem.title}.`,
          type: "match",
          targetType: "Match",
          targetId: match._id,
        }),
        notify({
          recipient: match.foundItem.owner,
          title: "Possible match found",
          message: "Someone reported losing an item similar to the one you found.",
          type: "match",
          targetType: "Match",
          targetId: match._id,
        }),
      ]);
    }

    await ModerationAction.create({
      admin: user.id,
      action: ACTION_TO_LOG[action],
      targetType: "Match",
      targetId: match._id,
      reason: reason || null,
      ip: getRequestIp(request),
      before: { status: beforeStatus },
      after: { status: match.status },
    });

    return success({ id: match._id, status: match.status }, "Match updated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Admin moderate match error:", err);
    return error("Something went wrong while updating this match", 500);
  }
}
