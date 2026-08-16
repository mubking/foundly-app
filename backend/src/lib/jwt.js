import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error(
    "Missing JWT_SECRET environment variable. Define it in .env.local."
  );
}

/**
 * Signs a JWT for the given payload.
 *
 * @param {object} payload - Claims to embed in the token (e.g. { id, role }).
 * @returns {string} Signed JWT.
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws (JsonWebTokenError, TokenExpiredError, etc.) if the token is
 * missing, malformed, expired, or signed with a different secret —
 * callers should treat any thrown error as "unauthenticated".
 *
 * @param {string} token
 * @returns {object} Decoded payload.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

