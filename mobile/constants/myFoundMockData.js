// Labels/colors for FoundItem.status (backend enum: open, matched, claimed,
// closed — see backend/src/models/FoundItem.js). Not the same vocabulary
// MyFoundScreen's old mock data used ("claim_pending"/"returned"), which
// didn't correspond to any real backend status value.
export const STATUS_CONFIG = {
  open: { variant: "amber", label: "Active" },
  matched: { variant: "purple", label: "Possible Match" },
  claimed: { variant: "primary", label: "Claim Pending" },
  closed: { variant: "green", label: "Returned ✓" },
};
