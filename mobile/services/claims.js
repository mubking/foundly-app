import api from "./api";
import { formatRelativeTime } from "../utils/time";
import { optimizeImageUrl } from "../utils/cloudinaryImage";

function toClaimDisplay(raw) {
  return {
    id: raw.id,
    status: raw.status,
    message: raw.message,
    reward: raw.reward,
    proofImage: raw.proofImage ? optimizeImageUrl(raw.proofImage, "detail") : raw.proofImage,
    createdAt: raw.createdAt,
    claimant: raw.claimant,
    item: raw.item,
  };
}

/**
 * Wraps `POST /api/claims/create`. Requires auth. Fails with a 400 if the
 * caller owns the item, and 409 if they've already claimed it.
 *
 * @param {object} payload
 * @param {string} payload.itemId
 * @param {"lost"|"found"} payload.itemType
 * @param {string} payload.message
 * @param {number} [payload.reward]
 * @param {string} [payload.proofImage] - Hosted URL from `services/upload.js`.
 * @returns {Promise<object>} The created claim.
 * @throws {ApiError}
 */
export function submitClaim({ itemId, itemType, message, reward, proofImage }) {
  return api.post("/claims/create", { itemId, itemType, message, reward, proofImage });
}

/**
 * Wraps `GET /api/claims/mine` — every claim submitted against any item the
 * caller owns, across both Lost and Found. Requires auth.
 *
 * @param {{page?: number, limit?: number}} [params]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number}>}
 * @throws {ApiError}
 */
export async function getMyClaims({ page, limit } = {}) {
  const query = new URLSearchParams();
  if (page) query.set("page", String(page));
  if (limit) query.set("limit", String(limit));

  const qs = query.toString();
  const result = await api.get(`/claims/mine${qs ? `?${qs}` : ""}`);

  return { ...result, items: result.items.map(toClaimDisplay) };
}

/**
 * Maps `GET /api/claims/:id`'s response into the shape ClaimDetailsScreen
 * renders — same field-shaping conventions as services/items.js's
 * `toItemDetail`: images wrapped as `{ uri }` (or a placeholder), location
 * flattened to a display string, dates to relative-time labels.
 *
 * @param {object} raw
 * @returns {object}
 */
function toClaimDetailDisplay(raw) {
  const { address, city, state } = raw.item.location || {};

  return {
    id: raw.id,
    status: raw.status,
    message: raw.message,
    reward: raw.reward,
    proofImage: raw.proofImage ? { uri: optimizeImageUrl(raw.proofImage, "detail") } : null,
    createdAt: raw.createdAt,
    submittedTime: formatRelativeTime(raw.createdAt),
    claimant: {
      id: raw.claimant?.id,
      firstName: raw.claimant?.firstName,
      lastName: raw.claimant?.lastName,
      avatar: raw.claimant?.avatar ? { uri: optimizeImageUrl(raw.claimant.avatar, "avatar") } : null,
      isVerified: !!raw.claimant?.isVerified,
    },
    item: {
      id: raw.item.id,
      title: raw.item.title,
      type: raw.item.type,
      image: raw.item.images?.length ? { uri: optimizeImageUrl(raw.item.images[0], "thumb") } : null,
      location: address || [city, state].filter(Boolean).join(", ") || "Location unknown",
      date: formatRelativeTime(raw.item.date),
      status: raw.item.status,
      reward: raw.item.type === "lost" ? raw.item.reward || null : null,
    },
  };
}

/**
 * Wraps `GET /api/claims/:id`. Requires auth; 403 if the caller doesn't own
 * the underlying item, 404 if the claim doesn't exist. Backs the Claim
 * Details screen — one request for the item summary, claimant identity,
 * and the claim itself, instead of a second GET /api/items/:id round trip.
 *
 * @param {string} claimId
 * @returns {Promise<object>} See {@link toClaimDetailDisplay}.
 * @throws {ApiError}
 */
export async function getClaim(claimId) {
  const raw = await api.get(`/claims/${claimId}`);
  return toClaimDetailDisplay(raw);
}

/**
 * Wraps `PATCH /api/claims/:id/status` — approve or reject a claim made
 * against an item the caller owns. Requires auth; 403 if the caller doesn't
 * own the underlying item, 409 if the claim was already reviewed.
 *
 * @param {string} claimId
 * @param {"approved"|"rejected"} status
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export function reviewClaim(claimId, status) {
  return api.patch(`/claims/${claimId}/status`, { status });
}
