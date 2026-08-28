import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { parsePagination } from "@/utils/pagination";
import LostItem from "@/models/LostItem";
import { success, error } from "@/lib/response";

// Owner is deliberately excluded — every item here belongs to the
// authenticated caller, so there's nothing useful to populate.
const ITEM_SELECT = "title description category images location reward status createdAt";

export async function GET(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || "";
    const { page, limit, skip } = parsePagination(searchParams);

    await connectDB();

    const filter = { owner: user.id };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      LostItem.find(filter).select(ITEM_SELECT).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LostItem.countDocuments(filter),
    ]);

    return success({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get my lost items error:", err);
    return error("Something went wrong while fetching your lost items", 500);
  }
}
