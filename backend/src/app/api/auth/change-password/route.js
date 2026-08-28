import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import User from "@/models/User";
import { changePasswordSchema } from "@/validations/auth.validation";
import { success, error } from "@/lib/response";

const SALT_ROUNDS = 12;

// Changing your own password from inside the app (you know the current
// one) — distinct from POST /api/auth/reset-password, which is the
// forgot-password flow (a mailed 6-digit code instead of the current
// password). Same bcrypt compare/hash pattern as login and reset-password.
export async function PATCH(request) {
  try {
    let authUser;
    try {
      authUser = await requireActiveUser(request);
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

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    await connectDB();

    // password has `select: false` on the schema, so it must be opted
    // back in explicitly to compare it here.
    const user = await User.findById(authUser.id).select("+password");
    if (!user) {
      return error("User not found", 404);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return error("Current password is incorrect", 401);
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return success(null, "Password changed successfully");
  } catch (err) {
    console.error("Change password error:", err);
    return error("Something went wrong while changing your password", 500);
  }
}
