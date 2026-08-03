import { z } from "zod";

export const createClaimSchema = z.object({
  itemId: z.string().min(1, "itemId is required"),
  itemType: z.enum(["lost", "found"]),
  answers: z.array(z.string().min(1, "Answer cannot be empty")).min(1, "At least one answer is required"),
});

export const verifyClaimSchema = z.object({
  claimId: z.string().min(1, "claimId is required"),
  action: z.enum(["approve", "reject"]),
});

// Backs PATCH /api/claims/[id]/status — claim id comes from the route
// param there, not the body, so this schema only covers the decision.
export const reviewClaimSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
