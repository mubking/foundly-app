import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import User from "@/models/User";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import { deleteAccountSchema } from "@/validations/auth.validation";
import { success, error } from "@/lib/response";

// User-initiated account deletion (Settings > Delete Account). Soft-delete:
// flips `isActive` false (blocks login and every requireActiveUser-gated
// route immediately) and stamps `deletedAt`, but keeps the document itself
// so items/claims/messages this account authored don't dangle. Mirrors
// change-password's current-password confirmation, except the password is
// only required for accounts that have one (social-only accounts don't).
export async function DELETE(request) {
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
      body = {};
    }

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    // password has `select: false` on the schema, so it must be opted
    // back in explicitly to compare it here.
    const user = await User.findById(authUser.id).select("+password pushTokens");
    if (!user) {
      return error("User not found", 404);
    }

    if (user.password) {
      if (!parsed.data.password) {
        return error("Enter your password to delete your account", 400);
      }
      const isPasswordValid = await bcrypt.compare(parsed.data.password, user.password);
      if (!isPasswordValid) {
        return error("Current password is incorrect", 401);
      }
    }

    user.isActive = false;
    user.deletedAt = new Date();
    // No further pushes should reach a deleted account's devices.
    user.pushTokens = [];
    await user.save();

    // Option B (deactivation, not data deletion): flip every listing this
    // account owns to status "removed" so it drops out of public
    // search/feed/detail immediately (buildMatchStage in search.service.js
    // already excludes "removed"). Documents and Cloudinary assets are
    // retained; the API-level guarantees in search.service.js and
    // items/[id]/route.js additionally hide any listing whose owner is
    // inactive (covers admin-suspended accounts too).
    await Promise.all([
      LostItem.updateMany({ owner: user._id }, { $set: { status: "removed" } }),
      FoundItem.updateMany({ owner: user._id }, { $set: { status: "removed" } }),
    ]);

    return success(null, "Your account has been deleted");
  } catch (err) {
    console.error("Delete account error:", err);
    return error("Something went wrong while deleting your account", 500);
  }
}
