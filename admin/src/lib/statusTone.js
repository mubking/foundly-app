// Maps the various status/action enums used across the backend's admin
// models to a Badge tone, so every page renders the same status the same
// color instead of each page inventing its own mapping.
const TONE_MAP = {
  open: "success",
  matched: "info",
  claimed: "purple",
  closed: "neutral",
  suspended: "warning",
  removed: "danger",

  pending: "warning",
  reviewed: "info",
  dismissed: "neutral",
  resolved: "success",
  approved: "success",
  rejected: "danger",

  active: "success",
  inactive: "neutral",
  banned: "danger",
  verified: "success",
  unverified: "neutral",

  viewed: "info",
  claim_started: "purple",

  admin: "purple",
  user: "neutral",
};

export function statusTone(status) {
  return TONE_MAP[status] || "neutral";
}
