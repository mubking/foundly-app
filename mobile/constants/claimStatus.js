// Labels/colors for Claim.status (backend enum: pending, approved, rejected
// — see backend/src/models/Claim.js). Shared by every place a claim's
// status renders as a Pill — ClaimCard, ClaimDetailsScreen, ClaimContextCard,
// ChatScreen's header — so they can never drift out of sync with each other.
export const CLAIM_STATUS_VARIANT = { pending: "amber", approved: "green", rejected: "red" };
export const CLAIM_STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
