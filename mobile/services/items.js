import api from "./api";
import { formatRelativeTime } from "../utils/time";
import { optimizeImageUrl } from "../utils/cloudinaryImage";

/**
 * Maps one item from GET /api/items/search into the shape the item card
 * components (ItemCardFeatured, ItemCardRow) expect.
 *
 * Two fields have no backend equivalent yet and are filled with a
 * reasonable default rather than invented data:
 * - `image`: the backend returns `images: string[]` (Cloudinary URLs, may
 *   be empty); the first one is wrapped as `{ uri }` for React Native's
 *   `<Image source>`. `null` when there are none — SafeImage (every card
 *   component's image renderer) shows its own neutral "no image" icon for a
 *   falsy source; this never substitutes a stock/sample photo for a real
 *   item's missing image.
 * - `verified`: items have no "verified" concept in the backend at all
 *   (no such field on LostItem/FoundItem), so this is always `false` until
 *   the backend adds one.
 *
 * @param {object} raw - One entry from the search endpoint's `items` array.
 * @returns {object} `{id, type, title, category, location, neighborhood, time, image, reward, verified}`
 */
function toDisplayItem(raw) {
  const [firstImage] = raw.images || [];
  const { address, city, state } = raw.location || {};

  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    category: raw.category,
    brand: raw.brand || null,
    color: raw.color || null,
    location: address || city || "Location unknown",
    neighborhood: [city, state].filter(Boolean).join(", ") || "Location unknown",
    time: formatRelativeTime(raw.createdAt),
    image: firstImage ? { uri: optimizeImageUrl(firstImage, "thumb") } : null,
    // Raw (untransformed) URL, kept alongside the display-ready thumbnail so
    // a card tap can prefetch the larger "detail" variant Item Details will
    // actually render — see utils/cloudinaryImage.js's `prefetchImage`.
    imageUrl: firstImage || null,
    reward: raw.type === "lost" ? raw.reward || null : null,
    // Only present when the request sent `lat`/`lng` (see useSearchController's
    // "Nearest Location" sort) — null otherwise, not a guess.
    distanceKm: raw.distanceKm ?? null,
    verified: false,
  };
}

/**
 * Wraps `GET /api/items/search` — the only item-listing endpoint the
 * backend exposes (there is no separate list/browse endpoint under
 * `/items/lost` or `/items/found`, only POST-to-create). Public, no auth
 * required. Items in the response are pre-mapped via {@link toDisplayItem}.
 *
 * @param {object} [params]
 * @param {string} [params.q] - Free-text search across title/description.
 * @param {string} [params.category]
 * @param {string} [params.brand]
 * @param {string} [params.color]
 * @param {string} [params.city]
 * @param {string} [params.state]
 * @param {string} [params.dateFrom] - ISO date string.
 * @param {string} [params.dateTo] - ISO date string.
 * @param {boolean} [params.hasReward]
 * @param {boolean} [params.verifiedOnly]
 * @param {"open"|"matched"|"claimed"|"closed"} [params.status]
 * @param {"lost"|"found"|"all"} [params.type] - Defaults to "all" server-side.
 * @param {"newest"|"oldest"|"closest_match"|"highest_reward"|"nearest"|"most_active"} [params.sort]
 * @param {number} [params.lat] - Device latitude — only sent for the "nearest" sort.
 * @param {number} [params.lng] - Device longitude — only sent for the "nearest" sort.
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{items: object[], page: number, limit: number, total: number, totalPages: number, recommendations?: object}>}
 */
export async function searchItems(params = {}) {
  const result = await api.get(`/items/search${toQueryString(params)}`);
  return { ...result, items: result.items.map(toDisplayItem) };
}

/**
 * Serializes params into a `?key=value&...` query string, skipping
 * undefined/null/empty values. Returns `""` (no leading `?`) if nothing to send.
 * @param {object} params
 * @returns {string}
 */
export function toQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Most recently reported lost items, newest first (the search endpoint's
 * default sort).
 * @param {{limit?: number}} [options]
 * @returns {ReturnType<typeof searchItems>}
 */
export function getRecentLostItems({ limit = 10 } = {}) {
  return searchItems({ type: "lost", limit });
}

/**
 * Most recently reported found items, newest first.
 * @param {{limit?: number}} [options]
 * @returns {ReturnType<typeof searchItems>}
 */
export function getRecentFoundItems({ limit = 10 } = {}) {
  return searchItems({ type: "found", limit });
}

/**
 * Most recently reported items across both lost and found, newest first.
 * Used to power Home's mixed "Nearby Items" / "Recent Reports" sections.
 *
 * Note: despite the name, this is NOT proximity-sorted — LostItem/FoundItem
 * store `location.latitude`/`longitude`, but the search endpoint only
 * filters by `city`/`state` string match, no geo-radius query. This is the
 * closest real substitute available today; revisit once a geo endpoint
 * exists rather than sorting client-side on unreliable device state.
 * @param {{limit?: number}} [options]
 * @returns {ReturnType<typeof searchItems>}
 */
export function getRecentItems({ limit = 10 } = {}) {
  return searchItems({ type: "all", limit });
}

// getFeaturedItems() was requested "if the backend supports it" — it
// doesn't: there's no featured/highlighted flag on LostItem or FoundItem,
// and no dedicated endpoint. Not implemented, per "do not invent backend
// endpoints" — Home's "Nearby Items" rail uses getRecentItems() instead.

/**
 * Maps GET /api/items/:id's response into the shape ItemDetailsScreen
 * renders: a full-size image list (vs. search's single thumbnail), the
 * poster's name (no rating/returns count — the backend has no such
 * concept), and a human date label instead of a raw ISO string.
 *
 * @param {object} raw - The item document returned by GET /api/items/:id.
 * @returns {object} `{id, type, title, description, category, images, location, date, reward, status, owner}`
 */
function toItemDetail(raw) {
  const { address, city, state } = raw.location || {};
  const dateValue = raw.type === "lost" ? raw.dateLost : raw.dateFound;

  return {
    id: raw._id,
    type: raw.type,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    // Empty (not a placeholder photo) when the item has no uploaded images —
    // ItemDetailsHero renders NoImagePlaceholder instead of the carousel in
    // that case, rather than faking a stock image into the gallery.
    images: raw.images?.length ? raw.images.map((uri) => ({ uri: optimizeImageUrl(uri, "detail") })) : [],
    location: address || [city, state].filter(Boolean).join(", ") || "Location unknown",
    date: formatRelativeTime(dateValue),
    reward: raw.type === "lost" ? raw.reward || null : null,
    status: raw.status,
    owner: {
      id: raw.owner?._id,
      firstName: raw.owner?.firstName,
      lastName: raw.owner?.lastName,
    },
  };
}

/**
 * Wraps `GET /api/items/:id`. Public, no auth required.
 *
 * @param {string} id
 * @returns {Promise<object>} See {@link toItemDetail}.
 * @throws {ApiError} 400 for a malformed id, 404 if the item doesn't exist.
 */
export async function getItemById(id) {
  const raw = await api.get(`/items/${id}`);
  return toItemDetail(raw);
}

/**
 * Maps GET /api/items/:id's response into the raw shape the Edit Lost/Found
 * forms need to prefill. Unlike {@link toItemDetail} (built for display),
 * this keeps `location` as its original `{address, city, state, latitude,
 * longitude}` object and `images` as plain hosted URLs — exactly what
 * `updateItem` sends back to PATCH /api/items/:id.
 *
 * @param {string} id
 * @returns {Promise<object>} `{id, type, title, description, category, images, location, dateLost, dateFound, reward, status}`
 */
export async function getItemForEdit(id) {
  const raw = await api.get(`/items/${id}`);
  return {
    id: raw._id,
    type: raw.type,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    images: raw.images || [],
    location: raw.location || { address: "", city: "", state: "" },
    dateLost: raw.dateLost || null,
    dateFound: raw.dateFound || null,
    reward: raw.reward || 0,
    status: raw.status,
  };
}

/**
 * Wraps `PATCH /api/items/:id`. Requires auth; 403 if the caller isn't the
 * item's owner. `dateLost`/`dateFound` are intentionally not accepted here —
 * the backend's update schema excludes them (validations/update-item.validation.js).
 *
 * @param {string} id
 * @param {object} payload - Partial `{title, description, category, images, location, reward}`.
 * @returns {Promise<object>} The updated item document.
 * @throws {ApiError}
 */
export function updateItem(id, payload) {
  return api.patch(`/items/${id}`, payload);
}

/**
 * Wraps `POST /api/items/found`. Requires auth. `owner` and `status` are
 * set server-side and ignored if present here.
 *
 * @param {object} payload
 * @param {string} payload.title
 * @param {string} payload.description
 * @param {string} payload.category - One of `constants/itemCategories.js`.
 * @param {string[]} payload.images - Hosted URLs from `services/upload.js`.
 * @param {{address: string, city: string, state: string, latitude?: number, longitude?: number}} payload.location
 * @param {string} payload.dateFound - ISO date string.
 * @returns {Promise<object>} The created found-item document.
 * @throws {ApiError}
 */
export function createFoundItem(payload) {
  return api.post("/items/found", payload);
}

/**
 * Wraps `POST /api/items/lost`. Requires auth. `owner` and `status` are set
 * server-side and ignored if present here.
 *
 * @param {object} payload
 * @param {string} payload.title
 * @param {string} payload.description
 * @param {string} payload.category - One of `constants/itemCategories.js`.
 * @param {string[]} payload.images - Hosted URLs from `services/upload.js`.
 * @param {{address: string, city: string, state: string, latitude?: number, longitude?: number}} payload.location
 * @param {string} payload.dateLost - ISO date string.
 * @param {number} [payload.reward] - Defaults to 0 server-side.
 * @returns {Promise<object>} The created lost-item document.
 * @throws {ApiError}
 */
export function createLostItem(payload) {
  return api.post("/items/lost", payload);
}

/**
 * Wraps `DELETE /api/items/:id`. Requires auth; 403 if the caller isn't the
 * item's owner, 404 if it doesn't exist.
 *
 * @param {string} id
 * @returns {Promise<void>}
 * @throws {ApiError}
 */
export function deleteItem(id) {
  return api.delete(`/items/${id}`);
}
