// Mirrors backend/src/constants/categories.js — the admin app is a
// separate deployable, so it can't import across the two Next.js projects;
// kept in sync manually the same way backend/src/validations/update-item.validation.js
// already duplicates this same list.
export const ITEM_CATEGORIES = [
  "Phone",
  "Laptop",
  "Wallet",
  "Bag",
  "Keys",
  "Documents",
  "Jewelry",
  "Clothing",
  "Pet",
  "Other",
];

export const LISTING_STATUSES = ["open", "matched", "claimed", "closed", "suspended", "removed"];

// Mirrors backend/src/models/ModerationAction.js's exported
// MODERATION_ACTIONS — same manual-mirror convention as ITEM_CATEGORIES
// above (separate deployable, can't import across the two Next.js apps).
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

export const SPAM_TYPES = [
  "duplicate_posts",
  "too_many_posts",
  "repeated_messages",
  "mass_messaging",
  "repeated_failed_claims",
  "repeated_reports",
];

// Mirrors backend/src/app/api/admin/notifications/route.js's CATEGORY_TYPES
// bucket names (the actual type->category mapping stays server-side; the
// admin UI only needs the bucket names to render filter options).
export const NOTIFICATION_CATEGORIES = ["claims", "messages", "matches", "reports", "verification", "system"];
