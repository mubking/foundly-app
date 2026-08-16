import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import Report from "@/models/Report";
// Not used directly, but User/LostItem/FoundItem must be registered in
// this module's scope before .populate("reporter"/"target") can resolve
// them — "target" is polymorphic via refPath across all three models.
import "@/models/User";
import "@/models/LostItem";
import "@/models/FoundItem";
import { success, error } from "@/lib/response";

const VALID_STATUSES = ["pending", "reviewed", "dismissed", "resolved"];
const VALID_TARGET_TYPES = ["lost", "found", "user"];
const VALID_REASONS = ["spam", "inappropriate", "fraud", "harassment", "other"];

const TARGET_TYPE_TO_MODEL = { lost: "LostItem", found: "FoundItem", user: "User" };
const MODEL_TO_TARGET_TYPE = { LostItem: "lost", FoundItem: "found", User: "user" };

function toReportResult(report) {
  return {
    id: report._id,
    reporter: report.reporter
      ? {
          id: report.reporter._id,
          firstName: report.reporter.firstName,
          lastName: report.reporter.lastName,
          email: report.reporter.email,
        }
      : null,
    target: report.target,
    targetType: MODEL_TO_TARGET_TYPE[report.targetType] || report.targetType,
    reason: report.reason,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt,
  };
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
    if (status && !VALID_STATUSES.includes(status)) {
      return error(`Invalid "status" — must be one of: ${VALID_STATUSES.join(", ")}`, 400);
    }

    const targetType = searchParams.get("targetType")?.trim() || "";
    if (targetType && !VALID_TARGET_TYPES.includes(targetType)) {
      return error(`Invalid "targetType" — must be one of: ${VALID_TARGET_TYPES.join(", ")}`, 400);
    }

    const reason = searchParams.get("reason")?.trim() || "";
    if (reason && !VALID_REASONS.includes(reason)) {
      return error(`Invalid "reason" — must be one of: ${VALID_REASONS.join(", ")}`, 400);
    }

    const reporter = searchParams.get("reporter")?.trim() || "";
    if (reporter && !mongoose.Types.ObjectId.isValid(reporter)) {
      return error("Invalid reporter ID", 400);
    }

    const target = searchParams.get("target")?.trim() || "";
    if (target && !mongoose.Types.ObjectId.isValid(target)) {
      return error("Invalid target ID", 400);
    }

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = TARGET_TYPE_TO_MODEL[targetType];
    if (reason) filter.reason = reason;
    if (reporter) filter.reporter = reporter;
    if (target) filter.target = target;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate({ path: "reporter", select: "firstName lastName email" })
        // "-password" is safe against every referenced model even though
        // only User has that field — Mongoose just excludes it when present.
        .populate({ path: "target", select: "-password" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    return success({
      items: reports.map(toReportResult),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get admin reports error:", err);
    return error("Something went wrong while fetching reports", 500);
  }
}
