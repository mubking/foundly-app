import api from "./api";
import { toQueryString } from "./items";

/**
 * Wraps `GET /api/items/search/suggestions`. Public, no auth required —
 * `previousSearches` is simply empty when logged out.
 * @param {string} q
 * @returns {Promise<{categories: string[], brands: string[], previousSearches: string[], popularSearches: string[]}>}
 */
export function getSearchSuggestions(q) {
  return api.get(`/items/search/suggestions${toQueryString({ q })}`);
}

/**
 * Wraps `GET /api/search/saved`. Requires auth.
 * @returns {Promise<object[]>}
 */
export function listSavedSearches() {
  return api.get("/search/saved");
}

/**
 * Wraps `POST /api/search/saved`. Requires auth.
 * @param {{name?: string, filters: object}} payload - `filters` is the same
 *   shape `searchItems` accepts (see services/items.js).
 * @returns {Promise<object>}
 */
export function createSavedSearch(payload) {
  return api.post("/search/saved", payload);
}

/**
 * Wraps `DELETE /api/search/saved/:id`. Requires auth; 403 if not the owner.
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteSavedSearch(id) {
  return api.delete(`/search/saved/${id}`);
}

/**
 * Wraps `GET /api/search/recent`. Requires auth.
 * @param {{sort?: "recent"|"popular"}} [options]
 * @returns {Promise<object[]>}
 */
export function listRecentSearches({ sort } = {}) {
  return api.get(`/search/recent${toQueryString({ sort })}`);
}

/**
 * Wraps `DELETE /api/search/recent/:id` — removes one recent search. Requires auth.
 * @param {string} id
 * @returns {Promise<void>}
 */
export function deleteRecentSearch(id) {
  return api.delete(`/search/recent/${id}`);
}

/**
 * Wraps `DELETE /api/search/recent` — clears every recent search for the
 * current user. Requires auth.
 * @returns {Promise<void>}
 */
export function clearRecentSearches() {
  return api.delete("/search/recent");
}
