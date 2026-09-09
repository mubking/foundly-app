import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import { success, error } from "@/lib/response";
import { getBlockedUserIds } from "@/services/block.service";
import { runSearch, recordSearchAnalytics, getEmptyStateSuggestions } from "@/services/search.service";
import { withRequestLogging } from "@/lib/logger";

const VALID_TYPES = ["lost", "found", "all"];
const VALID_SORTS = ["newest", "oldest", "closest_match", "highest_reward", "nearest", "most_active"];
// Statuses a caller may explicitly filter the *public* feed by. buildMatchStage
// excludes "suspended" (admin-hidden pending review) and "removed"
// (soft-deleted) by default, but its explicit-status override means a crafted
// `?status=suspended`/`?status=removed` would otherwise enumerate every listing
// a moderator has taken down — this whitelist stops that override from
// bypassing moderation. "claimed"/"closed" stay accepted because, unlike
// suspended/removed, they are ordinary terminal states of a listing's
// lifecycle (previously requestable through this same param).
const PUBLIC_FILTER_STATUSES = new Set(["open", "matched", "claimed", "closed"]);

function parseFloatParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (raw === null || raw === "") return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function parseDateParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

async function handleGET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q")?.trim() || "";
    const type = (searchParams.get("type") || "all").toLowerCase();
    const sort = (searchParams.get("sort") || "newest").toLowerCase();

    if (!VALID_TYPES.includes(type)) {
      return error('Invalid "type" — must be one of: lost, found, all', 400);
    }
    if (!VALID_SORTS.includes(sort)) {
      return error(`Invalid "sort" — must be one of: ${VALID_SORTS.join(", ")}`, 400);
    }

    const rawStatus = searchParams.get("status")?.trim() || "";
    if (rawStatus && !PUBLIC_FILTER_STATUSES.has(rawStatus)) {
      return error(
        'Invalid "status" — must be one of: open, matched, claimed, closed',
        400
      );
    }

    const { page, limit, skip } = parsePagination(searchParams);

    const filters = {
      q,
      category: searchParams.get("category")?.trim() || "",
      brand: searchParams.get("brand")?.trim() || "",
      color: searchParams.get("color")?.trim() || "",
      city: searchParams.get("city")?.trim() || "",
      state: searchParams.get("state")?.trim() || "",
      status: rawStatus,
      dateFrom: parseDateParam(searchParams, "dateFrom"),
      dateTo: parseDateParam(searchParams, "dateTo"),
      hasReward: searchParams.get("hasReward") === "true",
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      lat: parseFloatParam(searchParams, "lat"),
      lng: parseFloatParam(searchParams, "lng"),
    };

    await connectDB();

    // Optionally authenticated — public search must keep working for
    // logged-out/invalid-token requests. A valid user's block list hides
    // blocked users' listings, and their id backs "previous searches".
    let userId = null;
    try {
      const user = getAuthUser(request);
      userId = user.id;
      filters.blockedOwnerIds = await getBlockedUserIds(user.id);
    } catch (err) {
      if (!(err instanceof AuthError)) throw err;
    }

    const { items, total } = await runSearch({ type, filters, sort, skip, limit });

    // Fire-and-forget — never allowed to fail or delay the response.
    if (q) recordSearchAnalytics({ userId, query: q });

    const payload = {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    if (total === 0) {
      payload.recommendations = await getEmptyStateSuggestions(filters);
    }

    return success(payload);
  } catch (err) {
    console.error("Search items error:", err);
    return error("Something went wrong while searching items", 500);
  }
}

export const GET = withRequestLogging(handleGET, { route: "/api/items/search" });
