import { connectDB } from "./db";
import User from "@/models/User";
import { requireActiveUser, AuthError } from "./auth";

/**
 * Authenticates a request and requires the resulting user to be an admin.
 * Every `/api/admin/*` route needs exactly this check — centralizing it
 * here means the role check can't be forgotten or typo'd on a new route.
 *
 * Delegates to {@link requireActiveUser} for token verification and the
 * banned/suspended check (same rules, not duplicated here), then re-reads
 * `role` from the database rather than trusting the JWT's copy of it — a
 * JWT stays valid for JWT_EXPIRES_IN (default 7d) after issuance, so an
 * admin demoted or banned mid-session would otherwise keep admin access
 * on their existing token until it expires.
 *
 * @param {Request} request
 * @returns {Promise<object>} The decoded JWT payload (e.g. { id, role }).
 * @throws {AuthError} 401 if unauthenticated, 403 if banned/suspended or
 *   not currently an admin.
 */
export async function requireAdmin(request) {
  const user = await requireActiveUser(request);

  await connectDB();
  const account = await User.findById(user.id).select("role").lean();
  if (!account || account.role !== "admin") {
    throw new AuthError("Forbidden: admin access required", 403);
  }

  return user;
}
