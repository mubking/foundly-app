import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import User from "@/models/User";
import { pushTokenSchema } from "@/validations/user.validation";
import { success, error } from "@/lib/response";

function parseBody(request) {
  return request.json().catch(() => null);
}

/**
 * Registers (or re-registers, on refresh) an Expo push token for the
 * caller's account. Idempotent — $addToSet means sending the same token
 * twice, or a token another of the user's own devices already registered,
 * is a no-op rather than a duplicate.
 */
export async function POST(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const body = await parseBody(request);
    if (!body) return error("Invalid JSON in request body", 400);

    const parsed = pushTokenSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    await User.updateOne({ _id: user.id }, { $addToSet: { pushTokens: parsed.data.token } });

    return success(undefined, "Push token registered");
  } catch (err) {
    console.error("Register push token error:", err);
    return error("Something went wrong while registering the push token", 500);
  }
}

/**
 * Unregisters an Expo push token from the caller's account — called on
 * logout, for the specific device that's signing out, so a session ending
 * on one device doesn't keep receiving pushes for it.
 */
export async function DELETE(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const body = await parseBody(request);
    if (!body) return error("Invalid JSON in request body", 400);

    const parsed = pushTokenSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    await User.updateOne({ _id: user.id }, { $pull: { pushTokens: parsed.data.token } });

    return success(undefined, "Push token unregistered");
  } catch (err) {
    console.error("Unregister push token error:", err);
    return error("Something went wrong while unregistering the push token", 500);
  }
}
