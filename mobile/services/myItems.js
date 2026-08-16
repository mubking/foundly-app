import api from "./api";
import { formatRelativeTime } from "../utils/time";
import { optimizeImageUrl } from "../utils/cloudinaryImage";
import { toQueryString } from "./items";

/**
 * Maps one item from `GET /api/items/mine/lost` or `GET /api/items/mine/found`.
 *
 * Unlike `/api/items/search`, these endpoints return the raw
 * `LostItem`/`FoundItem` document shape straight off `.lean()` — `_id`
 * instead of `id`, and no `type` field at all (see
 * backend/src/app/api/items/mine/{lost,found}/route.js) — so this maps that
 * shape directly rather than reusing `services/items.js`'s `toDisplayItem`.
 * `type` is supplied by the caller since each endpoint is already scoped to
 * one type.
 *
 * @param {object} raw - One entry from a "mine" endpoint's `items` array.
 * @param {"lost"|"found"} type
 * @returns {object} `{id, type, title, category, location, neighborhood, time, image, reward, status}`
 */
function toMyItemDisplay(raw, type) {
  const [firstImage] = raw.images || [];
  const { address, city, state } = raw.location || {};

  return {
    id: raw._id,
    type,
    title: raw.title,
    category: raw.category,
    location: address || city || "Location unknown",
    neighborhood: [city, state].filter(Boolean).join(", ") || "Location unknown",
    time: formatRelativeTime(raw.createdAt),
    image: firstImage ? { uri: optimizeImageUrl(firstImage, "thumb") } : null,
    imageUrl: firstImage || null,
    reward: type === "lost" ? raw.reward || null : null,
    status: raw.status,
  };
}

/**
 * Wraps `GET /api/items/mine/lost`. Requires auth. Items in the response
 * are pre-mapped via {@link toMyItemDisplay}.
 *
 * @param {object} [params]
 * @param {"open"|"matched"|"claimed"|"closed"} [params.status]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number}>}
 */
export async function getMyLostItems(params = {}) {
  const result = await api.get(`/items/mine/lost${toQueryString(params)}`);
  return { ...result, items: result.items.map((raw) => toMyItemDisplay(raw, "lost")) };
}

/**
 * Wraps `GET /api/items/mine/found`. Requires auth. Items in the response
 * are pre-mapped via {@link toMyItemDisplay}.
 *
 * @param {object} [params]
 * @param {"open"|"matched"|"claimed"|"closed"} [params.status]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number}>}
 */
export async function getMyFoundItems(params = {}) {
  const result = await api.get(`/items/mine/found${toQueryString(params)}`);
  return { ...result, items: result.items.map((raw) => toMyItemDisplay(raw, "found")) };
}
