import { z } from "zod";

export const createClaimSchema = z.object({
  itemId: z.string().min(1, "itemId is required"),
  itemType: z.enum(["lost", "found"]),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be 1000 characters or fewer"),
  reward: z.coerce.number().min(0, "Reward cannot be negative").optional(),
  proofImage: z.string().trim().min(1).optional(),
});

// Backs PATCH /api/claims/[id]/status — claim id comes from the route
// param there, not the body, so this schema only covers the decision.
export const reviewClaimSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
