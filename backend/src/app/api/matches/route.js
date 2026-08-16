import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import Match from "@/models/Match";
// Not used directly, but Match.lostItem/foundItem only store `ref:` strings
// — Mongoose needs both schemas registered in this module's scope before
// .populate() can resolve them (same reasoning as items/[id]/route.js's
// User import).
import "@/models/LostItem";
import "@/models/FoundItem";
import { success, error } from "@/lib/response";

const ITEM_SELECT = "title images location category status";

function toItemPreview(item) {
  if (!item) return null;
  return {
    id: item._id,
    title: item.title,
    images: item.images,
    location: item.location,
    category: item.category,
    status: item.status,
  };
}

function toMatchResult(match, userId) {
  return {
    id: match._id,
    score: match.score,
    reasons: match.reasons,
    status: match.status,
    // Which side of the match the caller owns — lets the client know which
    // item is "theirs" (e.g. to know whose item to claim on "Start Claim").
    role: match.lostOwner.toString() === userId ? "lost" : "found",
    createdAt: match.createdAt,
    lostItem: toItemPreview(match.lostItem),
    foundItem: toItemPreview(match.foundItem),
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
    const { page, limit, skip } = parsePagination(searchParams);

    const filter = { $or: [{ lostOwner: user.id }, { foundOwner: user.id }] };
    const status = searchParams.get("status");
    if (status) filter.status = status;

    await connectDB();

    const [matches, total] = await Promise.all([
      Match.find(filter)
        .populate({ path: "lostItem", select: ITEM_SELECT })
        .populate({ path: "foundItem", select: ITEM_SELECT })
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Match.countDocuments(filter),
    ]);

    // A match can outlive one of its two items (DELETE /api/items/[id]
    // doesn't cascade-delete Match records) — populate resolves those to
    // null, so they're dropped here rather than sent to the client broken.
    const items = matches.filter((m) => m.lostItem && m.foundItem).map((m) => toMatchResult(m, user.id));

    return success({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Get matches error:", err);
    return error("Something went wrong while fetching matches", 500);
  }
}
