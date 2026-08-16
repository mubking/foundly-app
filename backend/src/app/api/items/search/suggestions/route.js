import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { success, error } from "@/lib/response";
import { escapeRegex } from "@/utils/regex";
import { ITEM_CATEGORIES } from "@/constants/categories";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import RecentSearch from "@/models/RecentSearch";
import PopularSearchTerm from "@/models/PopularSearchTerm";

const BRAND_SUGGESTION_LIMIT = 8;
const SEARCH_SUGGESTION_LIMIT = 5;

/** Distinct brand values across both collections, anchored-prefix match (index-friendly, not a full scan). */
async function suggestBrands(q) {
  if (!q) return [];
  const pattern = new RegExp(`^${escapeRegex(q)}`, "i");
  const [lostBrands, foundBrands] = await Promise.all([
    LostItem.distinct("brand", { brand: pattern }),
    FoundItem.distinct("brand", { brand: pattern }),
  ]);
  return [...new Set([...lostBrands, ...foundBrands])].slice(0, BRAND_SUGGESTION_LIMIT);
}

function suggestCategories(q) {
  if (!q) return [];
  const needle = q.toLowerCase();
  return ITEM_CATEGORIES.filter((category) => category.toLowerCase().startsWith(needle)).slice(0, BRAND_SUGGESTION_LIMIT);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    await connectDB();

    let userId = null;
    try {
      userId = getAuthUser(request).id;
    } catch (err) {
      if (!(err instanceof AuthError)) throw err;
    }

    const [categories, brands, previousSearches, popularSearches] = await Promise.all([
      suggestCategories(q),
      suggestBrands(q),
      userId
        ? RecentSearch.find({ owner: userId })
            .sort({ lastSearchedAt: -1 })
            .limit(SEARCH_SUGGESTION_LIMIT)
            .select("query")
            .lean()
        : [],
      PopularSearchTerm.find({}).sort({ count: -1 }).limit(SEARCH_SUGGESTION_LIMIT).select("term").lean(),
    ]);

    return success({
      categories,
      brands,
      previousSearches: previousSearches.map((entry) => entry.query),
      popularSearches: popularSearches.map((entry) => entry.term),
    });
  } catch (err) {
    console.error("Search suggestions error:", err);
    return error("Something went wrong while fetching search suggestions", 500);
  }
}
