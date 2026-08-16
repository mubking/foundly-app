import mongoose from "mongoose";

// Single source of truth for the action enum — also exported so the
// admin-log route's `action` filter validation and the admin frontend's
// mirrored constant (admin/src/lib/constants.js, same manual-mirror
// convention as ITEM_CATEGORIES) both read from one list instead of
// duplicating it.
export const MODERATION_ACTIONS = [
  "approve_report",
  "dismiss_report",
  "suspend_listing",
  "delete_listing",
  "restore_listing",
  "feature_listing",
  "unfeature_listing",
  "edit_listing",
  "warn_user",
  "suspend_account",
  "reactivate_account",
  "ban_account",
  "unban_account",
  "verify_account",
  "unverify_account",
  "approve_verification",
  "reject_verification",
  "request_resubmission",
  "approve_claim",
  "reject_claim",
  "resolve_match",
  "dismiss_match",
  "renotify_match",
  "ignore_spam_flag",
  "action_spam_flag",
];

const moderationActionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: MODERATION_ACTIONS,
    },

    // Polymorphic reference, same refPath pattern as Report.target/
    // Claim.item — resolves against whichever model name is stored in
    // `targetType`, so .populate("target") works regardless of what was
    // acted on.
    targetType: {
      type: String,
      required: true,
      enum: ["User", "LostItem", "FoundItem", "Report", "VerificationRequest", "Claim", "Match", "SpamFlag"],
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    // Best-effort, same trust level as lib/requestIp.js's other consumer
    // (login rate-limiting) — client-suppliable, not used for any auth
    // decision, purely a forensic record for the audit log.
    ip: {
      type: String,
      default: null,
    },

    // Best-effort forensic snapshot of the mutated field(s), only ever
    // populated by write sites added after this field existed — never
    // backfilled, so older rows legitimately have both as null rather than
    // a fabricated diff.
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// "See report/user history" — every action against a given target, newest first.
moderationActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
// An admin's own action history.
moderationActionSchema.index({ admin: 1, createdAt: -1 });

export default mongoose.models.ModerationAction ||
  mongoose.model("ModerationAction", moderationActionSchema);
