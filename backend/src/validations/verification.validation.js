import { z } from "zod";

export const submitVerificationSchema = z.object({
  documents: z.array(z.string()).min(1, "At least one document is required"),
  note: z.string().trim().max(1000, "Note must be at most 1000 characters").optional(),
});

export const reviewVerificationSchema = z.object({
  decision: z.enum(["approve", "reject", "resubmit"]),
  note: z.string().trim().max(1000, "Note must be at most 1000 characters").optional(),
});
