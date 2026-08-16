import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Message from "@/models/Message";
import Claim from "@/models/Claim";
import Report from "@/models/Report";
import SpamFlag from "@/models/SpamFlag";
import User from "@/models/User";
import { notify } from "@/lib/notifications";

// Deliberately generous — this only ever creates a review-queue entry
// (Feature 6: "Do NOT automatically ban"), so false positives cost an
// admin a look, not a user their account. Tune from real usage once there
// is any.
const THRESHOLDS = {
  too_many_posts: 10, // items posted by one owner in 24h
  mass_messaging: 15, // distinct conversations messaged in 10 min
  repeated_messages: 20, // messages in one conversation within 5 min
  repeated_failed_claims: 5, // rejected claims in 30 days
  repeated_reports: 3, // reports filed against one user in 30 days
};

// Purely a presentational label for the admin Spam queue — NOT a second
// scoring system. There is no numeric spam score anywhere in this service
// (every signal above is a boolean threshold crossing); this just ranks
// the flag *types* themselves by how serious a signal they tend to be, so
// the admin UI can sort/badge without inventing a fabricated number.
export const SEVERITY = {
  repeated_reports: "high",
  repeated_failed_claims: "high",
  duplicate_posts: "medium",
  mass_messaging: "medium",
  too_many_posts: "medium",
  repeated_messages: "low",
};

/**
 * Creates a SpamFlag and notifies admins — but only once per (user, type)
 * while a flag of that type is still open, so a burst of the same signal
 * doesn't spam admins with duplicate alerts. Every call site wraps its own
 * evaluation in try/catch and calls this fire-and-forget, right after the
 * write that triggered it already succeeded — a broken signal must never
 * fail the request it's attached to.
 */
async function raiseFlag(userId, type, detail) {
  const existing = await SpamFlag.findOne({ user: userId, type, status: "open" }).select("_id").lean();
  if (existing) return;

  await SpamFlag.create({ user: userId, type, detail });

  const admins = await User.find({ role: "admin" }).select("_id").lean();
  await Promise.all(
    admins.map((admin) =>
      notify({
        recipient: admin._id,
        title: "Suspicious activity flagged",
        message: detail,
        type: "spam_flagged",
        targetType: "User",
        targetId: userId,
      })
    )
  );
}

/**
 * Call after a lost/found item is successfully created.
 * @param {string} ownerId
 * @param {Array<{score: number}>} [duplicateMatches] - Result of duplicate-detection.service.js#findPossibleDuplicates, if already computed for this same create — reused instead of re-querying.
 */
export async function evaluateItemCreation(ownerId, duplicateMatches) {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [lostCount, foundCount] = await Promise.all([
      LostItem.countDocuments({ owner: ownerId, createdAt: { $gte: since } }),
      FoundItem.countDocuments({ owner: ownerId, createdAt: { $gte: since } }),
    ]);

    const total = lostCount + foundCount;
    if (total > THRESHOLDS.too_many_posts) {
      await raiseFlag(ownerId, "too_many_posts", `${total} items posted in the last 24 hours`);
    }

    if (duplicateMatches?.some((match) => match.score >= 0.85)) {
      await raiseFlag(ownerId, "duplicate_posts", "Posted an item nearly identical to an existing listing");
    }
  } catch (err) {
    console.error("Spam evaluation (item creation) error:", err);
  }
}

/** Call after a message is successfully created. */
export async function evaluateMessageSent({ senderId, conversationId }) {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [distinctConversations, recentInConversation] = await Promise.all([
      Message.distinct("conversation", { sender: senderId, createdAt: { $gte: tenMinAgo } }),
      Message.countDocuments({ conversation: conversationId, sender: senderId, createdAt: { $gte: fiveMinAgo } }),
    ]);

    if (distinctConversations.length > THRESHOLDS.mass_messaging) {
      await raiseFlag(
        senderId,
        "mass_messaging",
        `Messaged ${distinctConversations.length} different conversations within 10 minutes`
      );
    }
    if (recentInConversation > THRESHOLDS.repeated_messages) {
      await raiseFlag(
        senderId,
        "repeated_messages",
        `Sent ${recentInConversation} messages in one conversation within 5 minutes`
      );
    }
  } catch (err) {
    console.error("Spam evaluation (message sent) error:", err);
  }
}

/** Call after a claim is rejected. */
export async function evaluateClaimRejected(claimantId) {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rejectedCount = await Claim.countDocuments({
      claimant: claimantId,
      status: "rejected",
      updatedAt: { $gte: since },
    });

    if (rejectedCount > THRESHOLDS.repeated_failed_claims) {
      await raiseFlag(claimantId, "repeated_failed_claims", `${rejectedCount} rejected claims in the last 30 days`);
    }
  } catch (err) {
    console.error("Spam evaluation (claim rejected) error:", err);
  }
}

/** Call after a report is successfully created against a user. */
export async function evaluateReportCreated(targetUserId) {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await Report.countDocuments({
      targetType: "User",
      target: targetUserId,
      createdAt: { $gte: since },
    });

    if (count > THRESHOLDS.repeated_reports) {
      await raiseFlag(targetUserId, "repeated_reports", `${count} reports filed against this user in the last 30 days`);
    }
  } catch (err) {
    console.error("Spam evaluation (report created) error:", err);
  }
}
