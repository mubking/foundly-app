import mongoose from "mongoose";

import { verifyToken } from "../lib/jwt.js";
import { connectDB } from "../config/db.js";

// Minimal, read-only view of backend/src/models/User.js. It must point at
// the same "users" collection but doesn't need the full schema (password,
// validators, etc.) since this service only ever reads a couple of fields
// off an existing document — it never creates or edits users.
// Exported so services/notificationService.js can reuse the same model for
// its own recipient-activity check.
const userLookupSchema = new mongoose.Schema(
  { email: String, role: String, isActive: Boolean },
  { collection: "users" }
);
export const UserLookup =
  mongoose.models.UserLookup || mongoose.model("UserLookup", userLookupSchema);

/**
 * Socket.IO middleware: verifies the JWT the client sent and attaches
 * `socket.user = { id, email, role }`. Rejects the handshake (via
 * `next(error)`) for anything missing, malformed, expired, or signed with
 * a different secret than backend/'s.
 *
 * Token is expected either as `socket.handshake.auth.token` (recommended
 * for socket.io-client) or an `Authorization: Bearer <token>` header, so
 * it matches how the mobile app already sends tokens to backend/.
 */
export async function authenticateSocket(socket, next) {
  try {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Authentication error: missing token"));
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return next(new Error("Authentication error: invalid or expired token"));
    }

    await connectDB();
    const user = await UserLookup.findById(payload.id).select("email role isActive").lean();
    if (!user) {
      return next(new Error("Authentication error: user not found"));
    }
    // Option B (account deactivation): reject handshakes for deactivated or
    // suspended accounts so they can't (re)connect and keep receiving
    // real-time events (the notification watcher additionally re-checks the
    // recipient per event for already-connected sockets).
    if (user.isActive === false) {
      return next(new Error("Authentication error: account is not active"));
    }

    socket.user = {
      id: payload.id,
      email: user.email,
      role: user.role,
    };
    // Retained so handlers can forward it as Authorization: Bearer <token>
    // when calling backend/'s REST API on the user's behalf (e.g.
    // handlers/chat.js -> services/messageService.js) — the socket layer
    // never re-derives or re-signs identity, it just carries this along.
    socket.token = token;

    next();
  } catch (error) {
    next(new Error(`Authentication error: ${error.message}`));
  }
}

function extractToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers?.authorization || "";
  const [scheme, headerToken] = header.split(" ");
  return scheme === "Bearer" ? headerToken : null;
}

export default authenticateSocket;
