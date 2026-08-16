import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/validations/auth.validation";
import { generateToken } from "@/lib/jwt";
import { success, error } from "@/lib/response";
import { toPublicUser } from "@/lib/serializers";
import { rateLimitOrError } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/requestIp";
import { withRequestLogging } from "@/lib/logger";

// Same generic message for "no such user" and "wrong password" so the
// response never reveals which part of the credential pair was wrong.
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

async function handlePOST(request) {
  try {
    // Keyed by IP, not email — this guards against credential-guessing
    // against many accounts from one source, before we even know which
    // account (if any) is being targeted.
    const limited = await rateLimitOrError({
      key: `login:ip:${getRequestIp(request)}`,
      limit: 10,
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

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    // password has `select: false` on the schema, so it must be opted
    // back in explicitly to compare it here.
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return error(INVALID_CREDENTIALS_MESSAGE, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return error(INVALID_CREDENTIALS_MESSAGE, 401);
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
    console.error("Login error:", err);
    return error("Something went wrong while logging in", 500);
  }
}

export const POST = withRequestLogging(handlePOST, { route: "/api/auth/login" });
