import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { success, error } from "@/lib/response";
import SavedSearch from "@/models/SavedSearch";
import { createSavedSearchSchema } from "@/validations/saved-search.validation";
import { buildSavedSearchName } from "@/services/search.service";

function toSavedSearchResult(doc) {
  return {
    id: doc._id,
    name: doc.name,
    filters: doc.filters,
    createdAt: doc.createdAt,
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

    await connectDB();

    const savedSearches = await SavedSearch.find({ owner: user.id }).sort({ createdAt: -1 }).lean();

    return success(savedSearches.map(toSavedSearchResult));
  } catch (err) {
    console.error("List saved searches error:", err);
    return error("Something went wrong while fetching saved searches", 500);
  }
}

export async function POST(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = createSavedSearchSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const { name, filters } = parsed.data;

    const savedSearch = await SavedSearch.create({
      owner: user.id,
      name: name || buildSavedSearchName(filters),
      filters,
    });

    return success(toSavedSearchResult(savedSearch), "Search saved", 201);
  } catch (err) {
    console.error("Create saved search error:", err);
    return error("Something went wrong while saving the search", 500);
  }
}
