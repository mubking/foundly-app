import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthUser, AuthError } from "@/lib/auth";
import { success, error } from "@/lib/response";
import { toPublicUser } from "@/lib/serializers";

export async function GET(request) {
  try {
    let authUser;
    try {
      authUser = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    await connectDB();

    const user = await User.findById(authUser.id).select("-password").lean();
    if (!user) {
      return error("User not found", 404);
    }

    return success(toPublicUser(user));
  } catch (err) {
    console.error("Get current user error:", err);
    return error("Something went wrong while fetching your profile", 500);
  }
}
