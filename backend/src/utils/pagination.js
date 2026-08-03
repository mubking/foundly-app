const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses "page"/"limit" query params into safe, bounded integers plus a
 * ready-to-use Mongo "skip" offset. Falls back to defaults on anything
 * non-numeric, non-integer, or below 1 — never throws.
 *
 * @param {URLSearchParams} searchParams
 * @param {{ defaultLimit?: number, maxLimit?: number }} [options]
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(searchParams, options = {}) {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = options;

  let page = parseInt(searchParams.get("page"), 10);
  if (!Number.isInteger(page) || page < 1) page = 1;

  let limit = parseInt(searchParams.get("limit"), 10);
  if (!Number.isInteger(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
