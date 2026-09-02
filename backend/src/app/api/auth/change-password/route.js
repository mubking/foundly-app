import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { requireProviderReauth, SocialAuthLinkError } from "@/lib/socialAuth";
import User from "@/models/User";
import { changePasswordSchema } from "@/validations/auth.validation";
import { success, error } from "@/lib/response";

const SALT_ROUNDS = 12;

// Changing your own password from inside the app. Two account shapes, two
// reauthentication proofs — the route decides which from the *stored*
// account document, never from a client-supplied flag:
//
//  1. Email/password account (user.password set): the current password must
//     be provided and verified with bcrypt, exactly as before.
//  2. Social-only account (no password): a freshly-verified provider token
//     whose subject matches the account's stored providerId is required
//     before a password may be created. The account is NOT duplicated — the
//     same user document simply gains a password hash, which is what also
//     starts letting that email/password login work (see auth/login).
//
// The hash always goes through the same bcrypt rounds as registration and
// reset-password.
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

    const { currentPassword, newPassword, idToken, identityToken } = parsed.data;

    await connectDB();

    // password and providerId both have `select: false` on the schema, so
    // they must be opted back in explicitly — password to compare it here,
    // providerId so requireProviderReauth can check the token's subject
    // against the account's real linked identity.
    const user = await User.findById(authUser.id).select("+password +providerId");
    if (!user) {
      return error("User not found", 404);
    }

    if (user.password) {
      // Email/password account: current password confirmation.
      if (!currentPassword) {
        return error("Current password is required", 400);
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return error("Current password is incorrect", 401);
      }
    } else {
      // Social-only account: prove ownership of the linked provider identity
      // before creating a local password.
      await requireProviderReauth({ user, idToken, identityToken });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return success(null, "Password changed successfully");
  } catch (err) {
    if (err instanceof SocialAuthLinkError) return error(err.message, err.status);
    console.error("Change password error:", err);
    return error("Something went wrong while changing your password", 500);
  }
}
