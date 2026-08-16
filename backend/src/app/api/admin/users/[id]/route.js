import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import User from "@/models/User";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Claim from "@/models/Claim";
import Report from "@/models/Report";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";

// Backs the admin "View profile" screen: the user record plus enough
// activity counts to orient an admin without them having to separately
// query Listings/Reports/Audit Log filtered by this user first.
export async function GET(request, context) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid user ID", 400);
    }

    await connectDB();

    const target = await User.findById(id).select("-password").lean();
    if (!target) {
      return error("User not found", 404);
    }

    const [
      lostItemCount,
      foundItemCount,
      claimCount,
      reportsFiledCount,
      reportsAgainstCount,
      moderationActionCount,
    ] = await Promise.all([
      LostItem.countDocuments({ owner: id }),
      FoundItem.countDocuments({ owner: id }),
      Claim.countDocuments({ claimant: id }),
      Report.countDocuments({ reporter: id }),
      Report.countDocuments({ targetType: "User", target: id }),
      ModerationAction.countDocuments({ targetType: "User", targetId: id }),
    ]);

    return success({
      user: target,
      counts: {
        lostItems: lostItemCount,
        foundItems: foundItemCount,
        claims: claimCount,
        reportsFiled: reportsFiledCount,
        reportsAgainst: reportsAgainstCount,
        moderationActions: moderationActionCount,
      },
    });
  } catch (err) {
    console.error("Get admin user detail error:", err);
    return error("Something went wrong while fetching this user", 500);
  }
}
