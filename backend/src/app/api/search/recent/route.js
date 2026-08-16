import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { success, error } from "@/lib/response";
import RecentSearch from "@/models/RecentSearch";

const SORT_FIELD_BY_KEY = {
  recent: { lastSearchedAt: -1 },
  popular: { usageCount: -1 },
};
const LIST_LIMIT = 20;

function toRecentSearchResult(doc) {
  return {
    id: doc._id,
    query: doc.query,
    usageCount: doc.usageCount,
    lastSearchedAt: doc.lastSearchedAt,
  };
}

export async function GET(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "recent";
    const sortField = SORT_FIELD_BY_KEY[sort] || SORT_FIELD_BY_KEY.recent;

    await connectDB();

    const recentSearches = await RecentSearch.find({ owner: user.id }).sort(sortField).limit(LIST_LIMIT).lean();

    return success(recentSearches.map(toRecentSearchResult));
  } catch (err) {
    console.error("List recent searches error:", err);
    return error("Something went wrong while fetching recent searches", 500);
  }
}

/** Clear all — owner-scoped only, never a bare deleteMany({}). */
export async function DELETE(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    await connectDB();

    await RecentSearch.deleteMany({ owner: user.id });

    return success(undefined, "Recent searches cleared");
  } catch (err) {
    console.error("Clear recent searches error:", err);
    return error("Something went wrong while clearing recent searches", 500);
  }
}
