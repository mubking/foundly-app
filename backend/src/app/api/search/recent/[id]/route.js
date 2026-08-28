import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { success, error } from "@/lib/response";
import RecentSearch from "@/models/RecentSearch";

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
      return error("Invalid recent search ID", 400);
    }

    await connectDB();

    const existing = await RecentSearch.findById(id).select("owner").lean();
    if (!existing) {
      return error("Recent search not found", 404);
    }
    if (existing.owner.toString() !== user.id) {
      return error("You are not allowed to delete this recent search", 403);
    }

    await RecentSearch.findByIdAndDelete(id);

    return success(undefined, "Recent search deleted");
  } catch (err) {
    console.error("Delete recent search error:", err);
    return error("Something went wrong while deleting the recent search", 500);
  }
}
