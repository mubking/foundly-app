import { connectDB } from "@/lib/db";
import { getAuthUser, AuthError } from "@/lib/auth";
import VerificationRequest from "@/models/VerificationRequest";
import User from "@/models/User";
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

    const [me, latestRequest] = await Promise.all([
      User.findById(user.id).select("verificationStatus isVerified").lean(),
      VerificationRequest.findOne({ user: user.id }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!me) {
      return error("User not found", 404);
    }

    return success({
      verificationStatus: me.verificationStatus,
      isVerified: me.isVerified,
      latestRequest: latestRequest
        ? {
            id: latestRequest._id,
            status: latestRequest.status,
            note: latestRequest.note,
            reviewNote: latestRequest.reviewNote,
            createdAt: latestRequest.createdAt,
            updatedAt: latestRequest.updatedAt,
          }
        : null,
    });
  } catch (err) {
    console.error("Get verification status error:", err);
    return error("Something went wrong while fetching your verification status", 500);
  }
}
