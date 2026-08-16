import bcrypt from "bcryptjs";
import crypto from "crypto";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { resetPasswordSchema } from "@/validations/auth.validation";
import { success, error } from "@/lib/response";
import { rateLimitOrError } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/requestIp";

const SALT_ROUNDS = 12;
const INVALID_CODE_MESSAGE = "That reset code is invalid or has expired";

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function safeCompare(a, b) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const email = parsed.data.email.toLowerCase();
    const { code, password } = parsed.data;

    // Keyed by email, not IP — a 6-digit code (900,000 possibilities) is
    // brute-forceable well within its 15-minute TTL without this. Mirrors
    // forgot-password's per-email keying so both endpoints in this flow are
    // covered.
    const limited = await rateLimitOrError({
      key: `reset-password:email:${email}`,
      limit: 10,
      windowSeconds: 15 * 60,
    });
    if (limited) return limited;

    const user = await User.findOne({ email }).select(
      "+resetPasswordCodeHash +resetPasswordExpires"
    );

    const isExpired =
      !user?.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now();
    const isCodeValid =
      user?.resetPasswordCodeHash && safeCompare(user.resetPasswordCodeHash, hashCode(code));

    if (!user || isExpired || !isCodeValid) {
      return error(INVALID_CODE_MESSAGE, 400);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordCodeHash: "", resetPasswordExpires: "" },
      }
    );

    return success(null, "Your password has been reset. You can now sign in.");
  } catch (err) {
    console.error("Reset password error:", err);
    return error("Something went wrong while resetting your password", 500);
  }
}
