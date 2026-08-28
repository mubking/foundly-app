import { requireActiveUser, AuthError } from "@/lib/auth";
import { describeItemFromImage, AiServiceError } from "@/lib/ai";
import { describeItemSchema } from "@/validations/ai.validation";
import { success, error } from "@/lib/response";
import { rateLimitOrError } from "@/lib/rateLimit";

// Backs the "Scan" button on AIScannerCard (mobile/components/common/AIScannerCard.js),
// used from both Report Lost and Report Found. Takes an already-uploaded
// image URL (POST /api/upload/image runs first, same as a normal listing
// photo) rather than a raw file, so this route stays a plain JSON call.
export async function POST(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const limited = await rateLimitOrError({
      key: `ai-describe:user:${user.id}`,
      limit: 20,
      windowSeconds: 60 * 60,
    });
    if (limited) return limited;

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = describeItemSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    let result;
    try {
      result = await describeItemFromImage(parsed.data.imageUrl);
    } catch (err) {
      if (err instanceof AiServiceError) return error(err.message, err.status, {}, err.code);
      throw err;
    }

    return success(result, "Item described successfully");
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.error("AI describe error:", err);
    return error("Something went wrong while analyzing the photo", 500);
  }
}
