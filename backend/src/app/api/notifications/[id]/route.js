import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import Notification from "@/models/Notification";
import { success, error } from "@/lib/response";
import { withRequestLogging } from "@/lib/logger";

/**
 * Deletes a single notification — scoped to the authenticated user by
 * including `recipient` in the delete filter, so a caller can never delete
 * another user's notification even if they know its id.
 */
async function handleDELETE(request, context) {
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
      return error("Invalid notification ID", 400);
    }

    await connectDB();

    const deleted = await Notification.findOneAndDelete({ _id: id, recipient: user.id });
    if (!deleted) {
      return error("Notification not found", 404);
    }

    return success(undefined, "Notification deleted");
  } catch (err) {
    console.error("Delete notification error:", err);
    return error("Something went wrong while deleting the notification", 500);
  }
}

export const DELETE = withRequestLogging(handleDELETE, { route: "/api/notifications/[id]" });