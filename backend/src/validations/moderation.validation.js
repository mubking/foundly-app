import { z } from "zod";

export const updateReportStatusSchema = z.object({
  status: z.enum(["reviewed", "dismissed", "resolved"]),
});

export const moderateListingSchema = z.object({
  action: z.enum(["suspend", "delete", "restore", "feature", "unfeature"]),
  reason: z.string().trim().max(1000, "Reason must be at most 1000 characters").optional(),
});

export const moderateUserSchema = z.object({
  action: z.enum(["warn", "suspend", "reactivate", "ban", "unban", "verify", "unverify"]),
  reason: z.string().trim().max(1000, "Reason must be at most 1000 characters").optional(),
});

export const adminReviewClaimSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(1000, "Reason must be at most 1000 characters").optional(),
});

export const reviewSpamFlagSchema = z.object({
  resolution: z.enum(["ignored", "actioned"]),
  reason: z.string().trim().max(1000, "Reason must be at most 1000 characters").optional(),
});
