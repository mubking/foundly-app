import { z } from "zod";

import { ITEM_CATEGORIES } from "@/constants/categories";

// Mirrors the filter params GET /api/items/search accepts (see
// services/search.service.js) — this is the shape both buildMatchStage and
// matchesFilters read.
const savedSearchFiltersSchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  type: z.enum(["lost", "found", "all"]).optional().default("all"),
  category: z.enum(ITEM_CATEGORIES).optional(),
  brand: z.string().trim().max(80).optional(),
  color: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  hasReward: z.boolean().optional().default(false),
  verifiedOnly: z.boolean().optional().default(false),
});

export const createSavedSearchSchema = z.object({
  // Auto-generated from `filters` when omitted — see buildSavedSearchName.
  name: z.string().trim().min(1).max(120).optional(),
  filters: savedSearchFiltersSchema,
});
