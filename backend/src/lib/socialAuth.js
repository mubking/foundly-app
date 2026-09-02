import User from "@/models/User";
import { verifyGoogleIdToken } from "./googleAuth";
import { verifyAppleIdentityToken } from "./appleAuth";

/**
 * Thrown by {@link findOrCreateSocialUser} for any linking/creation
 * failure a route handler should turn into a client error response rather
 * than a 500.
 */
export class SocialAuthLinkError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SocialAuthLinkError";
    this.status = status;
  }
}

/**
 * Finds, safely links, or creates the Reunio user for a verified provider
 * identity. Callers MUST have already cryptographically verified the
 * provider's token (see lib/googleAuth.js / lib/appleAuth.js) - every
 * argument here is treated as trusted, so nothing upstream of the verified
 * token payload should ever reach this function.
 *
 * Linking policy (Phase 10): the provider identity (`provider` +
 * `providerId`, the provider's stable `sub`) is always the primary lookup.
 * Only when that misses do we consider linking to an existing
 * email/password account - and only when the provider itself vouches the
 * email is verified, and only when that account isn't already linked to a
 * different provider. A client-supplied email alone is never enough to
 * merge into someone else's account.
 *
 * @param {object} params
 * @param {"google"|"apple"} params.provider
 * @param {string} params.providerId - The provider's verified `sub` claim.
 * @param {string|null|undefined} params.email
 * @param {boolean} params.emailVerified
 * @param {string|null|undefined} params.firstName
 * @param {string|null|undefined} params.lastName
 * @returns {Promise<import("mongoose").Document>} The found/linked/created user.
 * @throws {SocialAuthLinkError}
 */
export async function findOrCreateSocialUser({
  provider,
  providerId,
  email,
  emailVerified,
  firstName,
  lastName,
}) {
  const existingByProvider = await User.findOne({ provider, providerId });
  if (existingByProvider) {
    return existingByProvider;
  }

  const normalizedEmail = email ? email.toLowerCase() : null;

  if (normalizedEmail && emailVerified) {
    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      if (existingByEmail.provider && existingByEmail.provider !== provider) {
        // Already linked to a different provider identity - refuse to
        // silently reassign the link rather than overwrite it.
        throw new SocialAuthLinkError(
          "This email is already linked to a different sign-in method",
          409
        );
      }

      existingByEmail.provider = provider;
      existingByEmail.providerId = providerId;
      await existingByEmail.save();
      return existingByEmail;
    }
  }

  if (!normalizedEmail) {
    throw new SocialAuthLinkError(
      "No email address was provided by the sign-in provider",
      400
    );
  }

  try {
    return await User.create({
      firstName: firstName || "Reunio",
      lastName: lastName || "User",
      email: normalizedEmail,
      provider,
      providerId,
    });
  } catch (err) {
    // Duplicate email with an unverified provider email claim: we can't
    // safely link (see policy above), so this has to fail rather than
    // create a second account or silently take over the existing one.
    if (err.code === 11000) {
      throw new SocialAuthLinkError(
        "An account with this email already exists",
        409
      );
    }
    throw err;
  }
}

/**
 * Reauthenticates a social-only account owner during a sensitive action
 * (creating a password, deactivating the account). The client can never
 * merely claim the account is "Google" — it must present a freshly-verified
 * provider token whose subject exactly matches the account's stored
 * `providerId`. Nothing client-supplied except the token itself is trusted;
 * the *type* of proof required is decided here from the stored document.
 *
 * Only ever called for accounts that have NO local password — password
 * accounts go through bcrypt confirmation instead (see
 * api/auth/change-password and api/auth/delete-account).
 *
 * @param {object} params
 * @param {import("mongoose").Document | object} params.user - User doc/lean object (must include `provider` and `providerId`).
 * @param {string} [params.idToken] - Google ID token, for `provider === "google"`.
 * @param {string} [params.identityToken] - Apple identity token, for `provider === "apple"`.
 * @throws {SocialAuthLinkError} A generic 401 if the account has no provider,
 *   the matching token wasn't supplied, or signature/subject verification fails.
 */
export async function requireProviderReauth({ user, idToken, identityToken }) {
  let payload;
  try {
    if (user.provider === "google") {
      if (!idToken) {
        throw new SocialAuthLinkError(
          "Reauthentication failed. Please try again.",
          401
        );
      }
      payload = await verifyGoogleIdToken(idToken);
    } else if (user.provider === "apple") {
      if (!identityToken) {
        throw new SocialAuthLinkError(
          "Reauthentication failed. Please try again.",
          401
        );
      }
      payload = await verifyAppleIdentityToken(identityToken);
    } else {
      // No password AND no linked provider — no valid proof exists for this
      // account shape; refuse rather than guess.
      throw new SocialAuthLinkError(
        "Reauthentication isn't available for this account",
        400
      );
    }
  } catch (err) {
    if (err instanceof SocialAuthLinkError) throw err;
    // Expired/bad-signature/bad-audience provider token — generic message so
    // a client probing this endpoint learns nothing about the verification.
    throw new SocialAuthLinkError(
      "Reauthentication failed. Please try again.",
      401
    );
  }

  if (!payload.sub || payload.sub !== user.providerId) {
    throw new SocialAuthLinkError(
      "Reauthentication failed. Please try again.",
      401
    );
  }

  return { provider: user.provider, sub: payload.sub };
}
