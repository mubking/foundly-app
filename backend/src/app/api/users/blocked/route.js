import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import UserBlock from "@/models/UserBlock";
import { success, error } from "@/lib/response";

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

    const blocks = await UserBlock.find({ blocker: user.id })
      .populate({ path: "blocked", select: "firstName lastName avatar" })
      .sort({ createdAt: -1 })
      .lean();

    return success({
      items: blocks.map((block) => ({
        id: block.blocked._id,
        firstName: block.blocked.firstName,
        lastName: block.blocked.lastName,
        avatar: block.blocked.avatar,
        blockedAt: block.createdAt,
      })),
    });
  } catch (err) {
    console.error("Get blocked users error:", err);
    return error("Something went wrong while fetching your blocked users", 500);
  }
}
