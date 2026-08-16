import api from "./api";
import { formatRelativeTime } from "../utils/time";
import { optimizeImageUrl } from "../utils/cloudinaryImage";

/**
 * Maps one embedded lostItem/foundItem preview from GET /api/matches into
 * the shape MatchCard renders — same field-shaping conventions as
 * services/items.js's `toDisplayItem` (first image only, wrapped as
 * `{ uri }`, `null` when there are none).
 *
 * @param {object|null} item
 * @param {"lost"|"found"} type
 * @returns {object|null}
 */
function toItemDisplay(item, type) {
  if (!item) return null;
  const [firstImage] = item.images || [];
  const { address, city, state } = item.location || {};

  return {
    id: item.id,
    type,
    title: item.title,
    category: item.category,
    status: item.status,
    location: address || [city, state].filter(Boolean).join(", ") || "Location unknown",
    image: firstImage ? { uri: optimizeImageUrl(firstImage, "thumb") } : null,
  };
}

/**
 * @param {object} raw - One entry from GET /api/matches's `items` array.
 * @returns {object} `{id, score, reasons, status, role, createdAt, time, lostItem, foundItem}`
 */
function toMatchDisplay(raw) {
  return {
    id: raw.id,
    score: raw.score,
    reasons: raw.reasons,
    status: raw.status,
    role: raw.role,
    createdAt: raw.createdAt,
    time: formatRelativeTime(raw.createdAt),
    lostItem: toItemDisplay(raw.lostItem, "lost"),
    foundItem: toItemDisplay(raw.foundItem, "found"),
  };
}

/**
 * Wraps `GET /api/matches` — every Match involving an item the caller owns,
 * on either side (lost or found). Requires auth. Items in the response are
 * pre-mapped via {@link toMatchDisplay}.
 *
 * @param {object} [params]
 * @param {"pending"|"viewed"|"dismissed"|"claim_started"|"resolved"} [params.status]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number}>}
 * @throws {ApiError}
 */
export async function getMatches({ status, page, limit } = {}) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (page) query.set("page", String(page));
  if (limit) query.set("limit", String(limit));

  const qs = query.toString();
  const result = await api.get(`/matches${qs ? `?${qs}` : ""}`);

  return { ...result, items: result.items.map(toMatchDisplay) };
}

/**
 * Wraps `PATCH /api/matches/:id/status`. Requires auth; 403 if the caller
 * owns neither side of the match, 404 if it doesn't exist.
 *
 * @param {string} id
 * @param {"viewed"|"dismissed"|"claim_started"|"resolved"} status
 * @returns {Promise<{id: string, status: string}>}
 * @throws {ApiError}
 */
export function updateMatchStatus(id, status) {
  return api.patch(`/matches/${id}/status`, { status });
}
