import { connectDB } from "@/lib/db";
import { appleAuthSchema } from "@/validations/auth.validation";
import { verifyAppleIdentityToken } from "@/lib/appleAuth";
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
const INVALID_TOKEN_MESSAGE = "Invalid or expired Apple sign-in. Please try again.";

async function handlePOST(request) {
  try {
    const limited = await rateLimitOrError({
      key: `apple-auth:ip:${getRequestIp(request)}`,
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

    const parsed = appleAuthSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    let payload;
    try {
      payload = await verifyAppleIdentityToken(parsed.data.identityToken);
    } catch (err) {
      console.error("Apple identity token verification failed:", err.message);
      return error(INVALID_TOKEN_MESSAGE, 401);
    }

    // Apple's JWT carries the verified email on every sign-in (real or a
    // private-relay address) - `parsed.data.email` is only ever a
    // client-supplied fallback for the rare case the JWT omits it.
    const email = payload.email || parsed.data.email;
    const emailVerified = payload.email_verified === true || payload.email_verified === "true";
    // Apple only sends `fullName` in the authorization response body (not
    // in the JWT), and only on the user's very first authorization -
    // findOrCreateSocialUser only ever uses this for the initial account
    // creation, never to overwrite an existing user's stored name.
    const fullName = parsed.data.fullName;

    let user;
    try {
      user = await findOrCreateSocialUser({
        provider: "apple",
        providerId: payload.sub,
        email,
        emailVerified,
        firstName: fullName?.givenName,
        lastName: fullName?.familyName,
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
    console.error("Apple auth error:", err);
    return error("Something went wrong while signing in with Apple", 500);
  }
}

export const POST = withRequestLogging(handlePOST, { route: "/api/auth/apple" });
