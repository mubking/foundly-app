import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import User from "@/models/User";
import { updateProfileSchema } from "@/validations/user.validation";
import { success, error } from "@/lib/response";

// password has `select: false` on the schema already, but this is kept
// explicit here so the exclusion is visible at the call site too.
const PROFILE_SELECT = "-password";

export async function GET(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    await connectDB();

    const profile = await User.findById(user.id).select(PROFILE_SELECT).lean();
    if (!profile) {
      return error("User not found", 404);
    }

    return success(profile);
  } catch (err) {
    console.error("Get profile error:", err);
    return error("Something went wrong while fetching your profile", 500);
  }
}

export async function PATCH(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    // Zod strips any keys the schema doesn't declare — email, role, and
    // password can never survive into parsed.data no matter what the
    // client sends.
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    if (Object.keys(parsed.data).length === 0) {
      return error("No valid fields provided to update", 400);
    }

    await connectDB();

    const updated = await User.findByIdAndUpdate(
      user.id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    )
      .select(PROFILE_SELECT)
      .lean();

    if (!updated) {
      return error("User not found", 404);
    }

    return success(updated, "Profile updated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Update profile error:", err);
    return error("Something went wrong while updating your profile", 500);
  }
}
