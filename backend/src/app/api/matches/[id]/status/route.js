import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { updateMatchStatusSchema } from "@/validations/match.validation";
import Match from "@/models/Match";
import { success, error } from "@/lib/response";

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
      return error("Invalid match ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = updateMatchStatusSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const match = await Match.findById(id).select("lostOwner foundOwner status");
    if (!match) {
      return error("Match not found", 404);
    }

    if (match.lostOwner.toString() !== user.id && match.foundOwner.toString() !== user.id) {
      return error("You are not allowed to update this match", 403);
    }

    match.status = parsed.data.status;
    await match.save();

    return success({ id: match._id, status: match.status }, "Match updated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Update match status error:", err);
    return error("Something went wrong while updating the match", 500);
  }
}
