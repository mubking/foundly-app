import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import { escapeRegex } from "@/utils/regex";
import User from "@/models/User";
import { success, error } from "@/lib/response";

const USER_SELECT = "-password";
const VALID_ROLES = ["user", "admin"];

function buildFilter({ q, role, isActive, isVerified, banned }) {
  const filter = {};

  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }];
  }

  if (role) filter.role = role;
  if (isActive !== null) filter.isActive = isActive;
  if (isVerified !== null) filter.isVerified = isVerified;
  if (banned !== null) filter.banned = banned;

  return filter;
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

    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";

    if (role && !VALID_ROLES.includes(role)) {
      return error('Invalid "role" — must be one of: user, admin', 400);
    }

    const isActive = parseBoolParam(searchParams, "isActive");
    if (isActive === "invalid") {
      return error('Invalid "isActive" — must be one of: true, false', 400);
    }

    const isVerified = parseBoolParam(searchParams, "isVerified");
    if (isVerified === "invalid") {
      return error('Invalid "isVerified" — must be one of: true, false', 400);
    }

    const banned = parseBoolParam(searchParams, "banned");
    if (banned === "invalid") {
      return error('Invalid "banned" — must be one of: true, false', 400);
    }

    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = buildFilter({ q, role, isActive, isVerified, banned });

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(USER_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return success({
      items: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get admin users error:", err);
    return error("Something went wrong while fetching users", 500);
  }
}
