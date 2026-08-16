import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import { escapeRegex } from "@/utils/regex";
import { ITEM_CATEGORIES } from "@/constants/categories";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Report from "@/models/Report";
// Not used directly, but `owner` only stores a ref: "User" string — Mongoose
// needs the schema registered in this module's scope before .populate() can
// resolve it.
import "@/models/User";
import { success, error } from "@/lib/response";

const TYPE_LOOKUP = {
  lost: { Model: LostItem, modelName: "LostItem", dateField: "dateLost" },
  found: { Model: FoundItem, modelName: "FoundItem", dateField: "dateFound" },
};

const STATUS_ENUM = ["open", "matched", "claimed", "closed", "suspended", "removed"];
const OWNER_SELECT = "firstName lastName email avatar isVerified isActive";

function parseDateParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (!raw) return null;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseBoolParam(searchParams, key) {
  const raw = searchParams.get(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw !== null) return "invalid";
  return null;
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

    const type = (searchParams.get("type") || "lost").toLowerCase();
    const lookup = TYPE_LOOKUP[type];
    if (!lookup) {
      return error('Invalid "type" — must be one of: lost, found', 400);
    }

    const category = searchParams.get("category")?.trim() || "";
    if (category && !ITEM_CATEGORIES.includes(category)) {
      return error(`Invalid "category" — must be one of: ${ITEM_CATEGORIES.join(", ")}`, 400);
    }

    const status = searchParams.get("status")?.trim() || "";
    if (status && !STATUS_ENUM.includes(status)) {
      return error(`Invalid "status" — must be one of: ${STATUS_ENUM.join(", ")}`, 400);
    }

    const city = searchParams.get("city")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";

    const owner = searchParams.get("owner")?.trim() || "";
    if (owner && !mongoose.Types.ObjectId.isValid(owner)) {
      return error("Invalid owner ID", 400);
    }

    const dateFrom = parseDateParam(searchParams, "dateFrom");
    const dateTo = parseDateParam(searchParams, "dateTo");

    const featured = parseBoolParam(searchParams, "featured");
    if (featured === "invalid") {
      return error('Invalid "featured" — must be one of: true, false', 400);
    }

    const reported = parseBoolParam(searchParams, "reported");
    if (reported === "invalid") {
      return error('Invalid "reported" — must be one of: true, false', 400);
    }

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const { Model, modelName, dateField } = lookup;

    // Every report ever filed against a listing of this type, grouped —
    // backs both the "reported" filter and the reportCount shown per row.
    const reportCounts = await Report.aggregate([
      { $match: { targetType: modelName } },
      { $group: { _id: "$target", count: { $sum: 1 } } },
    ]);
    const reportCountMap = new Map(reportCounts.map((r) => [r._id.toString(), r.count]));

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (city) filter["location.city"] = new RegExp(escapeRegex(city), "i");
    if (owner) filter.owner = owner;
    if (featured !== null) filter.featured = featured;
    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: pattern }, { description: pattern }];
    }
    if (dateFrom || dateTo) {
      filter[dateField] = {};
      if (dateFrom) filter[dateField].$gte = dateFrom;
      if (dateTo) filter[dateField].$lte = dateTo;
    }
    if (reported !== null) {
      const reportedIds = [...reportCountMap.keys()];
      filter._id = reported ? { $in: reportedIds } : { $nin: reportedIds };
    }

    const [items, total] = await Promise.all([
      Model.find(filter)
        .populate({ path: "owner", select: OWNER_SELECT })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(filter),
    ]);

    return success({
      items: items.map((item) => ({
        ...item,
        type,
        reportCount: reportCountMap.get(item._id.toString()) || 0,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get admin listings error:", err);
    return error("Something went wrong while fetching listings", 500);
  }
}
