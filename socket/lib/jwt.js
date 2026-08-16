import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

/**
 * Verifies a JWT issued by backend/src/lib/jwt.js. This service only ever
 * verifies tokens (never signs them) — login/registration stays owned by
 * the Next.js backend.
 *
 * @param {string} token
 * @returns {object} Decoded payload, e.g. { id, role, iat, exp }.
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError} on invalid/expired tokens.
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export default verifyToken;
