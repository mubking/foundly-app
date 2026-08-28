import api from "./api";
import { optimizeImageUrl } from "../utils/cloudinaryImage";

/**
 * Maps one entry from `GET /api/users/blocked`.
 * @param {object} raw
 * @returns {object} `{id, firstName, lastName, avatar, blockedAt}`
 */
function toBlockedUserDisplay(raw) {
  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    avatar: raw.avatar ? { uri: optimizeImageUrl(raw.avatar, "avatar") } : null,
    blockedAt: raw.blockedAt,
  };
}

/**
 * Wraps `GET /api/users/blocked`. Requires auth.
 * @returns {Promise<object[]>} See {@link toBlockedUserDisplay}.
 * @throws {ApiError}
 */
export async function getBlockedUsers() {
  const raw = await api.get("/users/blocked");
  return raw.items.map(toBlockedUserDisplay);
}

/**
 * Wraps `POST /api/users/:id/block`. Requires auth. Idempotent — blocking
 * an already-blocked user still resolves. Stops either side from messaging
 * the other and hides them from the sender's search results.
 * @param {string} userId
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export function blockUser(userId) {
  return api.post(`/users/${userId}/block`);
}

/**
 * Wraps `DELETE /api/users/:id/block`. Requires auth. Idempotent — safe to
 * call for a user that isn't currently blocked.
 * @param {string} userId
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export function unblockUser(userId) {
  return api.delete(`/users/${userId}/block`);
}
