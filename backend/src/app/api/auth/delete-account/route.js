import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { requireProviderReauth, SocialAuthLinkError } from "@/lib/socialAuth";
import User from "@/models/User";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import { deleteAccountSchema } from "@/validations/auth.validation";
import { success, error } from "@/lib/response";

// User-initiated account deletion (Settings > Delete Account). Soft-delete:
// flips `isActive` false (blocks login and every requireActiveUser-gated
// route immediately) and stamps `deletedAt`, but keeps the document itself
// so items/claims/messages this account authored don't dangle.
//
// Reauthentication is required for EVERY account — never skipped and never
// satisfied by a client-supplied "authMethod" flag. Which proof is required
// is decided from the *stored* account document:
//
//  1. Email/password account (user.password set): the current password must
//     be provided and verified with bcrypt (as before).
//  2. Social-only account (no password): a freshly-verified provider token
//     whose subject matches the account's stored providerId must be
//     presented. There is NO passwordless deactivation path.
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

    // password and providerId both have `select: false` on the schema, so
    // they must be opted back in explicitly — password to compare it here,
    // providerId so requireProviderReauth can check the token's subject
    // against the account's real linked identity. pushTokens are cleared on
    // deactivation below.
    const user = await User.findById(authUser.id).select("+password +providerId pushTokens");
    if (!user) {
      return error("User not found", 404);
    }

    const { password, idToken, identityToken } = parsed.data;

    if (user.password) {
      // Email/password account: current password confirmation.
      if (!password) {
        return error("Enter your password to delete your account", 400);
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return error("Current password is incorrect", 401);
      }
    } else {
      // Social-only account: prove ownership of the linked provider identity
      // before the destructive action.
      await requireProviderReauth({ user, idToken, identityToken });
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
    //
    // The `owner` field is the single ownership reference on both models
    // (set from the same user id at creation — see items/found and
    // items/lost routes), so the updateMany filter matches by that field.
    // modifiedCount is returned so the client/tests can verify exactly how
    // many listings were hidden.
    const [lostItems, foundItems] = await Promise.all([
      LostItem.updateMany({ owner: user._id }, { $set: { status: "removed" } }),
      FoundItem.updateMany({ owner: user._id }, { $set: { status: "removed" } }),
    ]);

    return success(
      {
        lostItemsRemoved: lostItems.modifiedCount,
        foundItemsRemoved: foundItems.modifiedCount,
      },
      "Your account has been deleted"
    );
  } catch (err) {
    if (err instanceof SocialAuthLinkError) return error(err.message, err.status);
    console.error("Delete account error:", err);
    return error("Something went wrong while deleting your account", 500);
  }
}
