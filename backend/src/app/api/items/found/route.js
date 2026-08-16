import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { rateLimitOrError } from "@/lib/rateLimit";
import { createFoundItemSchema } from "@/validations/found-item.validation";
import FoundItem from "@/models/FoundItem";
import { success, error } from "@/lib/response";
import { deriveKeywords, findPossibleDuplicates } from "@/services/duplicate-detection.service";
import { evaluateItemCreation } from "@/services/spam-detection.service";
import { matchFoundItem } from "@/services/matching.service";
import { matchSavedSearches } from "@/services/search.service";

export async function POST(request) {
  try {
    // 1. Authenticate.
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const limited = await rateLimitOrError({
      key: `create-item:user:${user.id}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (limited) return limited;

    // 2. Parse the request body.
    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    // 3. Validate. Zod strips any keys not declared in the schema (e.g.
    // "owner", "status" sent by a malicious client), so parsed.data can
    // never carry either — owner is set explicitly below regardless.
    const parsed = createFoundItemSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const { acknowledgeDuplicates, ...itemData } = parsed.data;

    // 4. Connect to MongoDB.
    await connectDB();

    const keywords = deriveKeywords({ title: itemData.title, description: itemData.description });

    const possibleMatches = await findPossibleDuplicates({
      type: "found",
      title: itemData.title,
      description: itemData.description,
      category: itemData.category,
      brand: itemData.brand,
      color: itemData.color,
      keywords,
      location: itemData.location,
      date: itemData.dateFound,
      ownerId: user.id,
    });

    // 5. Duplicate check — warn, never silently reject or silently create.
    // Skipped once the user has acknowledged and resubmitted.
    if (!acknowledgeDuplicates && possibleMatches.length > 0) {
      return success(
        { duplicateWarning: true, possibleMatches },
        "We found similar items already on Foundly.",
        200
      );
    }

    const foundItem = await FoundItem.create({
      ...itemData,
      keywords,
      owner: user.id, // always from the verified token, never the body
      // status is intentionally omitted — the model defaults it to "open"
    });

    // Fire-and-forget — never allowed to fail or delay a successful create.
    evaluateItemCreation(user.id, possibleMatches);
    matchFoundItem(foundItem);
    matchSavedSearches({ type: "found", item: foundItem });

    return success(foundItem, "Found item reported successfully", 201);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Create found item error:", err);
    return error("Something went wrong while reporting the found item", 500);
  }
}
