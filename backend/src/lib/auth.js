import { verifyToken } from "./jwt";
import { connectDB } from "./db";
import User from "@/models/User";

/**
 * Thrown by getAuthUser() on any authentication failure. Carries the HTTP
 * status the caller should respond with, so route handlers can do:
 *
 *   try {
 *     user = getAuthUser(request);
 *   } catch (err) {
 *     if (err instanceof AuthError) return error(err.message, err.status);
 *     throw err;
 *   }
 */
export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * Reads "Authorization: Bearer <token>" from a request and verifies it.
 *
 * @param {Request} request
 * @returns {object} The decoded JWT payload (e.g. { id, role }).
 * @throws {AuthError} If the header is missing/malformed, or the token
 *   is invalid or expired.
 */
export function getAuthUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AuthError("Missing or malformed Authorization header", 401);
  }

  try {
    return verifyToken(token);
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}

/**
 * Same as {@link getAuthUser}, plus a fresh DB check that the account is
 * still active. A JWT stays valid for JWT_EXPIRES_IN (default 7d) after
 * it's issued — getAuthUser alone can't tell a suspended/banned account
 * from a good one until that token expires, since role/status aren't
 * re-checked on every request. Use this instead of getAuthUser for actions
 * a suspended/banned user shouldn't be able to take mid-session (creating
 * listings, sending messages, submitting claims, uploading images, ...).
 *
 * @param {Request} request
 * @returns {Promise<object>} The decoded JWT payload (e.g. { id, role }).
 * @throws {AuthError} 401 if unauthenticated, 403 if suspended/banned.
 */
export async function requireActiveUser(request) {
  const user = getAuthUser(request);

  await connectDB();
  const account = await User.findById(user.id).select("isActive banned deletedAt").lean();
  if (!account || !account.isActive) {
    const message = account?.deletedAt
      ? "This account has been deleted"
      : account?.banned
      ? "This account has been banned"
      : "This account has been suspended";
    throw new AuthError(message, 403);
  }

  return user;
}
