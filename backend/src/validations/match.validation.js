import { z } from "zod";

// Backs PATCH /api/matches/[id]/status — match id comes from the route
// param, not the body. "pending" is deliberately excluded: nothing manually
// reverts a match to pending, it's only ever the default a new/rescored
// match starts in (see services/matching.service.js).
export const updateMatchStatusSchema = z.object({
  status: z.enum(["viewed", "dismissed", "claim_started", "resolved"]),
});

// Backs POST /api/admin/matches/[id]/moderate — admin-only, no ownership
// check, so "resolve"/"dismiss" reuse the same Match.status values above
// under an explicit action name, plus "renotify" which doesn't change
// status at all (just resends the existing match notification).
export const adminMatchActionSchema = z.object({
  action: z.enum(["resolve", "dismiss", "renotify"]),
  reason: z.string().trim().max(1000, "Reason must be at most 1000 characters").optional(),
});
