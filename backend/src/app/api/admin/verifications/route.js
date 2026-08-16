import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import VerificationRequest from "@/models/VerificationRequest";
// Not used directly, but User must be registered before .populate("user") resolves.
import "@/models/User";
import { success, error } from "@/lib/response";

const VALID_STATUSES = ["pending", "approved", "rejected"];

function toVerificationResult(item) {
  return {
    id: item._id,
    user: item.user,
    status: item.status,
    provider: item.provider,
    documents: item.documents,
    note: item.note,
    reviewedBy: item.reviewedBy,
    reviewNote: item.reviewNote,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
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

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      VerificationRequest.find(filter)
        .populate({ path: "user", select: "firstName lastName email avatar verificationStatus" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VerificationRequest.countDocuments(filter),
    ]);

    return success({
      items: items.map(toVerificationResult),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get admin verifications error:", err);
    return error("Something went wrong while fetching verification requests", 500);
  }
}
