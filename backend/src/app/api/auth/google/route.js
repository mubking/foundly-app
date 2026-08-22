import { connectDB } from "@/lib/db";
import { googleAuthSchema } from "@/validations/auth.validation";
import { verifyGoogleIdToken } from "@/lib/googleAuth";
import { findOrCreateSocialUser, SocialAuthLinkError } from "@/lib/socialAuth";
import { generateToken } from "@/lib/jwt";
import { success, error } from "@/lib/response";
import { toPublicUser } from "@/lib/serializers";
import { rateLimitOrError } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/requestIp";
import { withRequestLogging } from "@/lib/logger";

// Generic message for any token-verification failure - never echoes back
// why (expired vs. bad signature vs. wrong audience, etc.) so a client
// probing this endpoint can't learn anything about the verification logic.
const INVALID_TOKEN_MESSAGE = "Invalid or expired Google sign-in. Please try again.";

async function handlePOST(request) {
  try {
    const limited = await rateLimitOrError({
      key: `google-auth:ip:${getRequestIp(request)}`,
      limit: 20,
      windowSeconds: 15 * 60,
    });
    if (limited) return limited;

    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = googleAuthSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    let payload;
    try {
      payload = await verifyGoogleIdToken(parsed.data.idToken);
    } catch (err) {
      console.error("Google ID token verification failed:", err.message);
      return error(INVALID_TOKEN_MESSAGE, 401);
    }

    let user;
    try {
      user = await findOrCreateSocialUser({
        provider: "google",
        providerId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === true,
        firstName: payload.given_name,
        lastName: payload.family_name,
      });
    } catch (err) {
      if (err instanceof SocialAuthLinkError) {
        return error(err.message, err.status);
      }
      throw err;
    }

    if (!user.isActive) {
      return error(
        user.banned ? "This account has been banned" : "This account has been suspended",
        403
      );
    }

    const token = generateToken({ id: user._id.toString(), role: user.role });

    return success(
      {
        token,
        user: toPublicUser(user),
      },
      "Login successful"
    );
  } catch (err) {
    console.error("Google auth error:", err);
    return error("Something went wrong while signing in with Google", 500);
  }
}

export const POST = withRequestLogging(handlePOST, { route: "/api/auth/google" });
