import { connectDB } from "@/lib/db";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import { escapeRegex } from "@/utils/regex";
import { success, error } from "@/lib/response";

const MAX_LIMIT = 100;
const VALID_TYPES = ["lost", "found", "all"];

const LOST_SELECT = "title description category images location reward status createdAt";
const FOUND_SELECT = "title description category images location status createdAt";

/**
 * Builds a shared Mongo filter from search query params. Same shape works
 * against both LostItem and FoundItem since the fields involved (category,
 * status, location.city/state, title/description) are named identically
 * on both schemas.
 */
function buildFilter({ q, category, city, state, status }) {
  const filter = {};

  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (city) filter["location.city"] = new RegExp(`^${escapeRegex(city)}$`, "i");
  if (state) filter["location.state"] = new RegExp(`^${escapeRegex(state)}$`, "i");

  return filter;
}

function toSearchResult(doc, type) {
  return {
    id: doc._id,
    type,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    images: doc.images,
    location: doc.location,
    ...(type === "lost" ? { reward: doc.reward } : {}),
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

/** type=lost or type=found: a single, efficiently-projected query. */
async function searchSingle(Model, type, filter, select, skip, limit) {
  const [docs, total] = await Promise.all([
    Model.find(filter).select(select).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);

  return { items: docs.map((doc) => toSearchResult(doc, type)), total };
}

/**
 * type=all: merges both collections at the database level via $unionWith
 * so sorting, pagination, and the total count are all correct across the
 * combined set — merging two independently-paginated queries in app code
 * would give wrong results on page 2+ (e.g. 20 lost + 20 found doesn't
 * mean the true "top 20 newest overall" are among them).
 */
async function searchAll(filter, skip, limit) {
  const pipeline = [
    { $addFields: { type: "lost" } },
    {
      $unionWith: {
        coll: FoundItem.collection.name,
        pipeline: [{ $addFields: { type: "found" } }],
      },
    },
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              id: "$_id",
              type: 1,
              title: 1,
              description: 1,
              category: 1,
              images: 1,
              location: 1,
              reward: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await LostItem.aggregate(pipeline);

  return {
    items: result.items,
    total: result.totalCount[0]?.count || 0,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";
    const state = searchParams.get("state")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const type = (searchParams.get("type") || "all").toLowerCase();

    if (!VALID_TYPES.includes(type)) {
      return error('Invalid "type" — must be one of: lost, found, all', 400);
    }

    let page = parseInt(searchParams.get("page"), 10);
    if (!Number.isInteger(page) || page < 1) page = 1;

    let limit = parseInt(searchParams.get("limit"), 10);
    if (!Number.isInteger(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, MAX_LIMIT);

    const skip = (page - 1) * limit;

    await connectDB();

    const filter = buildFilter({ q, category, city, state, status });

    let items;
    let total;

    if (type === "lost") {
      ({ items, total } = await searchSingle(LostItem, "lost", filter, LOST_SELECT, skip, limit));
    } else if (type === "found") {
      ({ items, total } = await searchSingle(FoundItem, "found", filter, FOUND_SELECT, skip, limit));
    } else {
      ({ items, total } = await searchAll(filter, skip, limit));
    }

    return success({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Search items error:", err);
    return error("Something went wrong while searching items", 500);
  }
}
