import api from "./api";

/**
 * Wraps `POST /api/reports`. Requires auth. Fails with a 400 if the target
 * doesn't exist, or if the caller is reporting their own item/account.
 *
 * @param {object} payload
 * @param {"lost"|"found"} payload.targetType
 * @param {string} payload.targetId
 * @param {"spam"|"inappropriate"|"fraud"|"harassment"|"other"} payload.reason
 * @param {string} [payload.description]
 * @returns {Promise<object>} The created report.
 * @throws {ApiError}
 */
export function submitReport({ targetType, targetId, reason, description }) {
  return api.post("/reports", { targetType, targetId, reason, description });
}
