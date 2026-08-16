import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import User from "@/models/User";
import RecentSearch from "@/models/RecentSearch";
import PopularSearchTerm from "@/models/PopularSearchTerm";
import SavedSearch from "@/models/SavedSearch";
import { notify } from "@/lib/notifications";
import { escapeRegex } from "@/utils/regex";
import { ITEM_CATEGORIES } from "@/constants/categories";

// Case-insensitive *equality* (not regex) — matches the collation the
// brand/color/city/state indexes on LostItem/FoundItem are built with (see
// those models). Every aggregate() call in this file that filters on those
// fields must pass this same collation, or it silently falls back to a
// collection scan.
const COLLATION = { locale: "en", strength: 2 };

const MODEL_BY_TYPE = { lost: LostItem, found: FoundItem };
const DATE_FIELD_BY_TYPE = { lost: "dateLost", found: "dateFound" };
const EARTH_RADIUS_KM = 6371;

const RESULT_PROJECTION = {
  _id: 0,
  id: "$_id",
  type: 1,
  title: 1,
  description: 1,
  category: 1,
  brand: 1,
  color: 1,
  images: 1,
  location: 1,
  reward: 1,
  status: 1,
  createdAt: 1,
  distanceKm: { $round: ["$distanceKm", 1] },
};

/**
 * Builds the Mongo match object for one collection (lost or found). Shared
 * by the live search pipeline (§runSearch) and, conceptually, by
 * {@link matchesFilters} below — the two can't literally be the same
 * function (one produces a Mongo query object, the other tests a single
 * plain JS object), so keep them in sync by hand when this changes.
 *
 * @param {"lost"|"found"} type
 * @param {object} params - q, category, brand, color, city, state, dateFrom,
 *   dateTo, hasReward, status, blockedOwnerIds.
 */
function buildMatchStage(type, params) {
  const { q, category, brand, color, city, state, dateFrom, dateTo, hasReward, status, blockedOwnerIds } = params;
  const dateField = DATE_FIELD_BY_TYPE[type];

  const match = {};

  // $text must be combined into the pipeline's first $match stage (see
  // buildTypePipeline) — it can't appear after other stages.
  if (q) match.$text = { $search: q };

  if (category) match.category = category;
  if (brand) match.brand = brand;
  if (color) match.color = color;
  if (city) match["location.city"] = city;
  if (state) match["location.state"] = state;

  if (dateFrom || dateTo) {
    match[dateField] = {};
    if (dateFrom) match[dateField].$gte = dateFrom;
    if (dateTo) match[dateField].$lte = dateTo;
  }

  // Reward only exists on LostItem — on the found branch this correctly
  // excludes every document (missing field never satisfies $gt).
  if (hasReward) match.reward = { $gt: 0 };

  match.status = status || { $nin: ["suspended", "removed"] };

  if (blockedOwnerIds?.length) match.owner = { $nin: blockedOwnerIds };

  return match;
}

/** Haversine great-circle distance in km, as an aggregation expression. Null when either point is missing. */
function distanceExpr(lat, lng) {
  return {
    $cond: [
      { $or: [{ $eq: ["$location.latitude", null] }, { $eq: ["$location.longitude", null] }] },
      null,
      {
        $let: {
          vars: {
            lat1: { $degreesToRadians: lat },
            lon1: { $degreesToRadians: lng },
            lat2: { $degreesToRadians: "$location.latitude" },
            lon2: { $degreesToRadians: "$location.longitude" },
          },
          in: {
            $multiply: [
              EARTH_RADIUS_KM,
              {
                $acos: {
                  // Clamped — floating point can push this a hair past 1
                  // for two near-identical points, which would make $acos
                  // return NaN instead of ~0.
                  $min: [
                    1,
                    {
                      $max: [
                        -1,
                        {
                          $add: [
                            { $multiply: [{ $sin: "$$lat1" }, { $sin: "$$lat2" }] },
                            {
                              $multiply: [
                                { $cos: "$$lat1" },
                                { $cos: "$$lat2" },
                                { $cos: { $subtract: ["$$lon2", "$$lon1"] } },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    ],
  };
}

/**
 * Builds one collection's branch of the pipeline: the first-stage $match
 * (required for $text), then computed fields (`type`, textScore when a
 * query was used, distance when coordinates were given). Used both as the
 * top-level pipeline (type=lost/found) and as a $unionWith sub-pipeline
 * (type=all) — see runSearch.
 */
function buildTypePipeline(type, params) {
  const { q, lat, lng } = params;
  const stages = [{ $match: buildMatchStage(type, params) }, { $addFields: { type } }];

  if (q) stages.push({ $addFields: { score: { $meta: "textScore" } } });
  if (lat != null && lng != null) stages.push({ $addFields: { distanceKm: distanceExpr(lat, lng) } });

  return stages;
}

const SORT_STAGE_BY_KEY = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest_reward: { reward: -1, createdAt: -1 },
  most_active: { updatedAt: -1 },
};

/**
 * @param {string} sort
 * @param {boolean} hasQuery - Whether `q` was provided (required for closest_match).
 * @param {boolean} hasGeo - Whether lat/lng were provided (required for nearest).
 */
function buildSortStage(sort, hasQuery, hasGeo) {
  if (sort === "closest_match" && hasQuery) return { score: { $meta: "textScore" } };
  if (sort === "nearest" && hasGeo) return { distanceKm: 1 };
  // Both documented fallbacks: identical to the newest-first default,
  // rather than erroring on a sort that has nothing to sort by yet.
  return SORT_STAGE_BY_KEY[sort] || SORT_STAGE_BY_KEY.newest;
}

/**
 * Runs a search across LostItem/FoundItem/both and returns a page of
 * results plus the total count. Single pipeline builder for all three
 * `type` values — `$unionWith` is only added for "all", not a separate
 * code path.
 *
 * @param {object} args
 * @param {"lost"|"found"|"all"} args.type
 * @param {object} args.filters - See buildMatchStage's params.
 * @param {string} args.sort
 * @param {number} args.skip
 * @param {number} args.limit
 * @returns {Promise<{items: object[], total: number}>}
 */
export async function runSearch({ type, filters, sort, skip, limit }) {
  const hasQuery = Boolean(filters.q);
  const hasGeo = filters.lat != null && filters.lng != null;

  let pipeline;
  let Model;

  if (type === "all") {
    Model = LostItem;
    pipeline = [
      ...buildTypePipeline("lost", filters),
      { $unionWith: { coll: FoundItem.collection.name, pipeline: buildTypePipeline("found", filters) } },
    ];
  } else {
    Model = MODEL_BY_TYPE[type];
    pipeline = buildTypePipeline(type, filters);
  }

  if (filters.verifiedOnly) {
    pipeline.push(
      { $lookup: { from: User.collection.name, localField: "owner", foreignField: "_id", as: "ownerDoc" } },
      { $unwind: "$ownerDoc" },
      { $match: { "ownerDoc.isVerified": true } }
    );
  }

  pipeline.push(
    { $sort: buildSortStage(sort, hasQuery, hasGeo) },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }, { $project: RESULT_PROJECTION }],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const [result] = await Model.aggregate(pipeline).collation(COLLATION);

  return {
    items: result.items,
    total: result.totalCount[0]?.count || 0,
  };
}

const TOKEN_RE = /[a-z0-9]+/g;
function tokenize(text) {
  return (text || "").toLowerCase().match(TOKEN_RE) || [];
}

/**
 * In-memory counterpart to {@link buildMatchStage}/{@link buildTypePipeline},
 * used to test a single newly-created item against a saved search's stored
 * filters (see matchSavedSearches) — cheaper than round-tripping through
 * Mongo for one document, and the item is already in hand at the call site.
 *
 * @param {object} item - A LostItem/FoundItem document (or plain object).
 * @param {"lost"|"found"} itemType
 * @param {object} filters - A SavedSearch's `filters` subdocument.
 * @returns {boolean}
 */
export function matchesFilters(item, itemType, filters) {
  if (filters.type && filters.type !== "all" && filters.type !== itemType) return false;
  if (filters.category && filters.category !== item.category) return false;
  if (filters.brand && filters.brand.toLowerCase() !== (item.brand || "").toLowerCase()) return false;
  if (filters.color && filters.color.toLowerCase() !== (item.color || "").toLowerCase()) return false;
  if (filters.city && filters.city.toLowerCase() !== (item.location?.city || "").toLowerCase()) return false;
  if (filters.state && filters.state.toLowerCase() !== (item.location?.state || "").toLowerCase()) return false;
  if (filters.hasReward && !(item.reward > 0)) return false;

  if (filters.q) {
    const queryTokens = tokenize(filters.q);
    const itemTokens = new Set([...tokenize(item.title), ...tokenize(item.description), ...(item.keywords || [])]);
    const hasOverlap = queryTokens.some((token) => itemTokens.has(token));
    if (!hasOverlap) return false;
  }

  return true;
}

/**
 * Fire-and-forget: records a committed search (non-empty `q`) for
 * "recent"/"popular" search suggestions. Never throws — called from the
 * search route without awaiting its rejection path affecting the response.
 *
 * @param {{userId?: string, query: string}} args
 */
export async function recordSearchAnalytics({ userId, query }) {
  const term = query.trim().toLowerCase();
  if (!term) return;

  try {
    const tasks = [
      PopularSearchTerm.updateOne(
        { term },
        { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
        { upsert: true }
      ),
    ];
    if (userId) {
      tasks.push(
        RecentSearch.updateOne(
          { owner: userId, query: query.trim() },
          { $inc: { usageCount: 1 }, $set: { lastSearchedAt: new Date() } },
          { upsert: true }
        )
      );
    }
    await Promise.all(tasks);
  } catch (err) {
    console.error("Record search analytics error:", err);
  }
}

/**
 * Fire-and-forget: notifies owners of any SavedSearch a newly created item
 * matches, via the existing notification pipeline (push/email/in-app list —
 * see lib/notifications.js). Event-driven off the two item-creation routes;
 * there is no cron/worker process in this app to poll for matches instead.
 *
 * @param {{type: "lost"|"found", item: import("mongoose").Document}} args
 */
export async function matchSavedSearches({ type, item }) {
  try {
    // Indexed pre-filter: only load saved searches whose category (if set)
    // matches this item's, or that have no category filter at all.
    const candidates = await SavedSearch.find({
      $or: [{ "filters.category": item.category }, { "filters.category": null }],
    }).lean();

    const matches = candidates.filter((saved) => matchesFilters(item, type, saved.filters));

    await Promise.all(
      matches.map((saved) =>
        notify({
          recipient: saved.owner,
          title: "New match for your saved search",
          message: `"${item.title}" matches your saved search "${saved.name}"`,
          type: "saved_search_match",
          targetType: type === "lost" ? "LostItem" : "FoundItem",
          targetId: item._id,
        })
      )
    );
  } catch (err) {
    console.error("Match saved searches error:", err);
  }
}

/**
 * Auto-generates a saved-search name from its filters when the caller
 * doesn't supply one — e.g. "Black iPhone in Lagos".
 * @param {object} filters
 * @returns {string}
 */
export function buildSavedSearchName(filters) {
  const parts = [filters.color, filters.brand, filters.q || filters.category].filter(Boolean);
  const subject = parts.length ? parts.join(" ") : "Items";
  return filters.city ? `${subject} in ${filters.city}` : subject;
}

/**
 * Empty-state recommendations (Phase 5) — computed only when a search
 * returns zero results, by relaxing one filter dimension at a time off
 * whatever else was applied. Each lookup is a small, capped `distinct()`
 * off an already-indexed field, so this adds no cost to the common
 * (non-empty) case.
 *
 * @param {object} filters
 * @returns {Promise<{similarCategories: string[], nearbyLocations: string[], similarColors: string[], similarBrands: string[]}>}
 */
export async function getEmptyStateSuggestions(filters) {
  const { category, city, state, brand, color, blockedOwnerIds } = filters;
  const baseFilter = { status: { $nin: ["suspended", "removed"] } };
  if (blockedOwnerIds?.length) baseFilter.owner = { $nin: blockedOwnerIds };

  const distinctAcrossBoth = async (field, extraFilter) => {
    const filter = { ...baseFilter, ...extraFilter };
    const [lostValues, foundValues] = await Promise.all([
      LostItem.distinct(field, filter).collation(COLLATION),
      FoundItem.distinct(field, filter).collation(COLLATION),
    ]);
    return [...new Set([...lostValues, ...foundValues].filter(Boolean))].slice(0, 5);
  };

  const [similarCategories, nearbyLocations, similarColors, similarBrands] = await Promise.all([
    // Other categories that DO have items in the same city/state.
    city || state
      ? distinctAcrossBoth("category", {
          category: { $ne: category || null },
          ...(city ? { "location.city": city } : {}),
          ...(state ? { "location.state": state } : {}),
        })
      : ITEM_CATEGORIES.filter((c) => c !== category).slice(0, 5),
    // Other cities within the same state/category that DO have matches.
    state
      ? distinctAcrossBoth("location.city", {
          "location.state": state,
          ...(city ? { "location.city": { $ne: city } } : {}),
          ...(category ? { category } : {}),
        })
      : [],
    distinctAcrossBoth("color", { color: { $ne: color || null }, ...(category ? { category } : {}) }),
    distinctAcrossBoth("brand", { brand: { $ne: brand || null }, ...(category ? { category } : {}) }),
  ]);

  return { similarCategories, nearbyLocations, similarColors, similarBrands };
}
