import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import User from "@/models/User";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Claim from "@/models/Claim";
import Match from "@/models/Match";
import Notification from "@/models/Notification";
import Report from "@/models/Report";
import VerificationRequest from "@/models/VerificationRequest";
import UserBlock from "@/models/UserBlock";
import SpamFlag from "@/models/SpamFlag";
import { success, error } from "@/lib/response";
import { dailySeries } from "@/utils/dailySeries";

const RECENT_LIMIT = 5;
const ACTIVITY_LIMIT = 20;

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * New-user counts for the current vs. previous calendar month, so the
 * dashboard can show real month-over-month growth instead of a single
 * point-in-time total.
 */
async function getMonthlyGrowth() {
  const now = new Date();
  const currentStart = startOfMonth(now);
  const previousStart = startOfMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

  const [current, previous] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: currentStart } }),
    User.countDocuments({ createdAt: { $gte: previousStart, $lt: currentStart } }),
  ]);

  const growthPercent = previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

  return { current, previous, growthPercent };
}

async function getRecentActivity() {
  const [newUsers, newReports, newClaims, newMatches, newVerifications] = await Promise.all([
    User.find().select("firstName lastName email createdAt").sort({ createdAt: -1 }).limit(RECENT_LIMIT).lean(),
    Report.find()
      .populate({ path: "reporter", select: "firstName lastName" })
      .select("reason targetType reporter createdAt")
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .lean(),
    Claim.find()
      .populate({ path: "claimant", select: "firstName lastName" })
      .populate({ path: "item", select: "title" })
      .select("claimant item itemType createdAt")
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .lean(),
    Match.find()
      .populate({ path: "lostItem", select: "title" })
      .populate({ path: "foundItem", select: "title" })
      .select("lostItem foundItem score createdAt")
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .lean(),
    VerificationRequest.find()
      .populate({ path: "user", select: "firstName lastName" })
      .select("user createdAt")
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .lean(),
  ]);

  const activity = [
    ...newUsers.map((u) => ({
      type: "user_signup",
      id: u._id,
      createdAt: u.createdAt,
      summary: `${u.firstName} ${u.lastName} signed up`,
      link: { type: "user", id: u._id },
    })),
    ...newReports.map((r) => ({
      type: "report_filed",
      id: r._id,
      createdAt: r.createdAt,
      summary: `${r.reporter ? `${r.reporter.firstName} ${r.reporter.lastName}` : "Someone"} filed a "${r.reason}" report against a ${r.targetType === "User" ? "user" : "listing"}`,
      link: { type: "report", id: r._id },
    })),
    ...newClaims.map((c) => ({
      type: "claim_submitted",
      id: c._id,
      createdAt: c.createdAt,
      summary: `${c.claimant ? `${c.claimant.firstName} ${c.claimant.lastName}` : "Someone"} submitted a claim on "${c.item?.title ?? "a listing"}"`,
      link: c.item ? { type: "listing", itemType: c.itemType === "LostItem" ? "lost" : "found", id: c.item._id } : null,
    })),
    ...newMatches.map((m) => ({
      type: "match_created",
      id: m._id,
      createdAt: m.createdAt,
      summary: `New ${m.score}% match: "${m.lostItem?.title ?? "?"}" ↔ "${m.foundItem?.title ?? "?"}"`,
      link: m.lostItem ? { type: "listing", itemType: "lost", id: m.lostItem._id } : null,
    })),
    ...newVerifications.map((v) => ({
      type: "verification_submitted",
      id: v._id,
      createdAt: v.createdAt,
      summary: `${v.user ? `${v.user.firstName} ${v.user.lastName}` : "Someone"} submitted a verification request`,
      link: { type: "verification", id: v._id },
    })),
  ];

  activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return activity.slice(0, ACTIVITY_LIMIT);
}

export async function GET(request) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    await connectDB();

    const [
      totalUsers,
      activeUsersCount,
      totalLostItems,
      totalFoundItems,
      totalClaims,
      totalMatches,
      totalNotifications,
      openLostItems,
      openFoundItems,
      pendingClaims,
      pendingReports,
      pendingVerifications,
      blockedUsersCount,
      suspendedUsersCount,
      removedListingsCount,
      openSpamFlags,
      recentActivity,
      recoveredLostItems,
      dailyUsers,
      dailyReports,
      dailyClaims,
      dailyMatches,
      monthlyGrowth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      LostItem.countDocuments(),
      FoundItem.countDocuments(),
      Claim.countDocuments(),
      Match.countDocuments(),
      Notification.countDocuments(),
      LostItem.countDocuments({ status: "open" }),
      FoundItem.countDocuments({ status: "open" }),
      Claim.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "pending" }),
      VerificationRequest.countDocuments({ status: "pending" }),
      UserBlock.distinct("blocker").then((ids) => ids.length),
      User.countDocuments({ isActive: false }),
      Promise.all([
        LostItem.countDocuments({ status: "removed" }),
        FoundItem.countDocuments({ status: "removed" }),
      ]).then(([lost, found]) => lost + found),
      SpamFlag.countDocuments({ status: "open" }),
      getRecentActivity(),
      LostItem.countDocuments({ status: "claimed" }),
      dailySeries(User),
      dailySeries(Report),
      dailySeries(Claim),
      dailySeries(Match),
      getMonthlyGrowth(),
    ]);

    // "Recovery rate": share of lost-item reports that reached status
    // "claimed" (i.e. reunited with an owner) — the only recovery signal
    // the data model actually supports today. Disclosed here rather than
    // silently defined, since there's no other stored notion of "recovered".
    const recoveryRate = totalLostItems === 0 ? null : Math.round((recoveredLostItems / totalLostItems) * 1000) / 10;

    return success({
      totalUsers,
      activeUsersCount,
      totalLostItems,
      totalFoundItems,
      totalClaims,
      totalMatches,
      totalNotifications,
      openLostItems,
      openFoundItems,
      pendingClaims,
      pendingReports,
      pendingVerifications,
      blockedUsersCount,
      suspendedUsersCount,
      removedListingsCount,
      openSpamFlags,
      recentActivity,
      recoveryRate,
      dailyUsers,
      dailyReports,
      dailyClaims,
      dailyMatches,
      monthlyGrowth,
    });
  } catch (err) {
    console.error("Get admin dashboard error:", err);
    return error("Something went wrong while fetching dashboard statistics", 500);
  }
}
