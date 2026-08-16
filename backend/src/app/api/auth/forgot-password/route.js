import crypto from "crypto";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/validations/auth.validation";
import { success, error } from "@/lib/response";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { rateLimitOrError } from "@/lib/rateLimit";

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Same response whether or not the account exists, so this endpoint can't
// be used to enumerate registered emails.
const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a password reset code to it.";

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
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

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const email = parsed.data.email.toLowerCase();

    const limited = await rateLimitOrError({
      key: `forgot-password:email:${email}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });
    if (limited) return limited;

    const user = await User.findOne({ email });

    if (user) {
      const code = crypto.randomInt(100000, 1000000).toString();

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetPasswordCodeHash: hashCode(code),
            resetPasswordExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
          },
        }
      );

      // Best-effort: an SMTP outage shouldn't turn this into a 500, and
      // shouldn't leak account e
      // xistence by responding differently either
      // — same reasoning as lib/notifications.js's best-effort email send.
      try {
        await sendPasswordResetEmail(email, code);
      } catch (err) {
        console.error("Send password reset email error:", {
          message: err.message,
          code: err.code,
          command: err.command,
          response: err.response,
          responseCode: err.responseCode,
        });
      }
    }

    return success(null, GENERIC_MESSAGE);
  } catch (err) {
    console.error("Forgot password error:", err);
    return error("Something went wrong while processing your request", 500);
  }
}
