import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { success, error } from "@/lib/response";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return error("Missing or malformed Authorization header", 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return error("Invalid or expired token", 401);
    }

    await connectDB();

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return error("User not found", 404);
    }

    return success(user);
  } catch (err) {
    console.error("Get current user error:", err);
    return error("Something went wrong while fetching your profile", 500);
  }
}
