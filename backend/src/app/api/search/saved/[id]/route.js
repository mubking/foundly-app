import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { success, error } from "@/lib/response";
import SavedSearch from "@/models/SavedSearch";

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
      return error("Invalid saved search ID", 400);
    }

    await connectDB();

    const existing = await SavedSearch.findById(id).select("owner").lean();
    if (!existing) {
      return error("Saved search not found", 404);
    }
    if (existing.owner.toString() !== user.id) {
      return error("You are not allowed to delete this saved search", 403);
    }

    await SavedSearch.findByIdAndDelete(id);

    return success(undefined, "Saved search deleted");
  } catch (err) {
    console.error("Delete saved search error:", err);
    return error("Something went wrong while deleting the saved search", 500);
  }
}
