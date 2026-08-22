import User from "@/models/User";

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
