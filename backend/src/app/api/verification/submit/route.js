import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { rateLimitOrError } from "@/lib/rateLimit";
import { submitVerificationSchema } from "@/validations/verification.validation";
import VerificationRequest from "@/models/VerificationRequest";
import User from "@/models/User";
import { success, error } from "@/lib/response";

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
      key: `verification-submit:user:${user.id}`,
      limit: 3,
      windowSeconds: 24 * 60 * 60,
    });
    if (limited) return limited;

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = submitVerificationSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    let verificationRequest;
    try {
      verificationRequest = await VerificationRequest.create({
        user: user.id,
        documents: parsed.data.documents,
        note: parsed.data.note || null,
      });
    } catch (err) {
      // Partial unique index on {user, status: "pending"} — one pending
      // request at a time.
      if (err.code === 11000) {
        return error("You already have a verification request pending review", 409);
      }
      throw err;
    }

    await User.findByIdAndUpdate(user.id, { verificationStatus: "pending" });

    return success(
      {
        id: verificationRequest._id,
        status: verificationRequest.status,
        createdAt: verificationRequest.createdAt,
      },
      "Verification request submitted successfully",
      201
    );
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Submit verification error:", err);
    return error("Something went wrong while submitting your verification request", 500);
  }
}
