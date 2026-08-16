import { z } from "zod";

export const createReportSchema = z.object({
  targetType: z.enum(["lost", "found", "user"]),
  targetId: z.string().min(1, "targetId is required"),
  reason: z.enum(["spam", "inappropriate", "fraud", "harassment", "other"]),
  description: z.string().trim().max(1000, "Description must be at most 1000 characters").optional(),
});
