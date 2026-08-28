import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import UserBlock from "@/models/UserBlock";
import { success, error } from "@/lib/response";

export async function GET(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    await connectDB();

    const blocks = await UserBlock.find({ blocker: user.id })
      .populate({ path: "blocked", select: "firstName lastName avatar isActive" })
      .sort({ createdAt: -1 })
      .lean();

    // Option B (account deactivation): a blocked user who deactivated their
    // account shows as "Deleted User" without an avatar.
    return success({
      items: blocks.map((block) => {
        const blockedInactive = Boolean(block.blocked && block.blocked.isActive === false);
        return {
          id: block.blocked._id,
          firstName: blockedInactive ? "Deleted" : block.blocked.firstName,
          lastName: blockedInactive ? "User" : block.blocked.lastName,
          avatar: blockedInactive ? null : block.blocked.avatar,
          blockedAt: block.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error("Get blocked users error:", err);
    return error("Something went wrong while fetching your blocked users", 500);
  }
}
