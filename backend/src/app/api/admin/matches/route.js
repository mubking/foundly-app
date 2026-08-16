import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import { escapeRegex } from "@/utils/regex";
import { ITEM_CATEGORIES } from "@/constants/categories";
import { VERY_LIKELY_THRESHOLD, POSSIBLE_THRESHOLD, MIN_SCORE_TO_STORE } from "@/services/matching.service";
import Match from "@/models/Match";
import { success, error } from "@/lib/response";

const STATUS_ENUM = ["pending", "viewed", "dismissed", "claim_started", "resolved"];
const BAND_RANGES = {
  very_likely: { $gte: VERY_LIKELY_THRESHOLD },
  possible: { $gte: POSSIBLE_THRESHOLD, $lt: VERY_LIKELY_THRESHOLD },
  weak: { $gte: MIN_SCORE_TO_STORE, $lt: POSSIBLE_THRESHOLD },
};

function band(score) {
  if (score >= VERY_LIKELY_THRESHOLD) return "very_likely";
  if (score >= POSSIBLE_THRESHOLD) return "possible";
  return "weak";
}

function parseDateParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function GET(request) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status")?.trim() || "";
    if (status && !STATUS_ENUM.includes(status)) {
      return error(`Invalid "status" — must be one of: ${STATUS_ENUM.join(", ")}`, 400);
    }

    const matchBand = searchParams.get("band")?.trim() || "";
    if (matchBand && !BAND_RANGES[matchBand]) {
      return error(`Invalid "band" — must be one of: ${Object.keys(BAND_RANGES).join(", ")}`, 400);
    }

    const category = searchParams.get("category")?.trim() || "";
    if (category && !ITEM_CATEGORIES.includes(category)) {
      return error(`Invalid "category" — must be one of: ${ITEM_CATEGORIES.join(", ")}`, 400);
    }

    const city = searchParams.get("city")?.trim() || "";
    const dateFrom = parseDateParam(searchParams, "dateFrom");
    const dateTo = parseDateParam(searchParams, "dateTo");

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const matchStage = {};
    if (status) matchStage.status = status;
    if (matchBand) matchStage.score = BAND_RANGES[matchBand];
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = dateFrom;
      if (dateTo) matchStage.createdAt.$lte = dateTo;
    }

    // Filtering/sorting on the two populated items' fields (category, city)
    // isn't expressible through .find()+.populate() — an aggregation
    // pipeline is the only way to $match against them server-side instead
    // of over-fetching and filtering in JS.
    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: "lostitems", localField: "lostItem", foreignField: "_id", as: "lostItemDoc" } },
      { $lookup: { from: "founditems", localField: "foundItem", foreignField: "_id", as: "foundItemDoc" } },
      // Drop matches whose item was hard-deleted — same defensive filter
      // the user-facing GET /api/matches applies after populate.
      { $match: { lostItemDoc: { $ne: [] }, foundItemDoc: { $ne: [] } } },
      { $addFields: { lostItemDoc: { $arrayElemAt: ["$lostItemDoc", 0] }, foundItemDoc: { $arrayElemAt: ["$foundItemDoc", 0] } } },
    ];

    if (category) pipeline.push({ $match: { "lostItemDoc.category": category } });
    if (city) pipeline.push({ $match: { "lostItemDoc.location.city": new RegExp(escapeRegex(city), "i") } });

    pipeline.push(
      { $sort: { score: -1, createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                score: 1,
                reasons: 1,
                status: 1,
                createdAt: 1,
                lostItem: {
                  id: "$lostItemDoc._id",
                  title: "$lostItemDoc.title",
                  images: "$lostItemDoc.images",
                  location: "$lostItemDoc.location",
                  category: "$lostItemDoc.category",
                  status: "$lostItemDoc.status",
                },
                foundItem: {
                  id: "$foundItemDoc._id",
                  title: "$foundItemDoc.title",
                  images: "$foundItemDoc.images",
                  location: "$foundItemDoc.location",
                  category: "$foundItemDoc.category",
                  status: "$foundItemDoc.status",
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const [result] = await Match.aggregate(pipeline);
    const items = result?.items || [];
    const total = result?.totalCount?.[0]?.count || 0;

    return success({
      items: items.map((m) => ({
        id: m._id,
        score: m.score,
        band: band(m.score),
        reasons: m.reasons,
        status: m.status,
        category: m.lostItem?.category,
        createdAt: m.createdAt,
        lostItem: m.lostItem,
        foundItem: m.foundItem,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get admin matches error:", err);
    return error("Something went wrong while fetching matches", 500);
  }
}
