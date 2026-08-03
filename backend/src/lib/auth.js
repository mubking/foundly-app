import { verifyToken } from "./jwt";

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
