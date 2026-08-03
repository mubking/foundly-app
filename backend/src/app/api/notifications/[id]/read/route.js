import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import Notification from "@/models/Notification";
import { success, error } from "@/lib/response";

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
      return error("Invalid notification ID", 400);
    }

    await connectDB();

    const notification = await Notification.findById(id);
    if (!notification) {
      return error("Notification not found", 404);
    }

    if (notification.recipient.toString() !== user.id) {
      return error("You are not allowed to update this notification", 403);
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    return success(undefined, "Notification marked as read");
  } catch (err) {
    console.error("Mark notification as read error:", err);
    return error("Something went wrong while updating the notification", 500);
  }
}
