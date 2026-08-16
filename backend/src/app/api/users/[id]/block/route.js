import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import User from "@/models/User";
import UserBlock from "@/models/UserBlock";
import { success, error } from "@/lib/response";

export async function POST(request, context) {
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
      return error("Invalid user ID", 400);
    }

    if (id === user.id) {
      return error("You cannot block yourself", 400);
    }

    await connectDB();

    const target = await User.findById(id).select("_id").lean();
    if (!target) {
      return error("User not found", 404);
    }

    try {
      await UserBlock.create({ blocker: user.id, blocked: id });
    } catch (err) {
      // Already blocked — idempotent, not an error.
      if (err.code !== 11000) throw err;
    }

    return success(undefined, "User blocked");
  } catch (err) {
    console.error("Block user error:", err);
    return error("Something went wrong while blocking this user", 500);
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
      return error("Invalid user ID", 400);
    }

    await connectDB();

    await UserBlock.deleteOne({ blocker: user.id, blocked: id });

    return success(undefined, "User unblocked");
  } catch (err) {
    console.error("Unblock user error:", err);
    return error("Something went wrong while unblocking this user", 500);
  }
}
