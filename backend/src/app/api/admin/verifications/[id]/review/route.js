import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { reviewVerificationSchema } from "@/validations/verification.validation";
import VerificationRequest from "@/models/VerificationRequest";
import User from "@/models/User";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";
import { notify } from "@/lib/notifications";

export async function POST(request, context) {
  try {
    let user;
    try {
      user = await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid verification request ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = reviewVerificationSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const verificationRequest = await VerificationRequest.findById(id);
    if (!verificationRequest) {
      return error("Verification request not found", 404);
    }

    if (verificationRequest.status !== "pending") {
      return error("This verification request has already been reviewed", 409);
    }

    const { decision, note } = parsed.data;
    const approved = decision === "approve";
    // "resubmit" is a rejection that asks the user to try again — same
    // terminal status as a plain reject (see the schema comment on
    // User.verificationStatus: submitting a new request is already allowed
    // once status is "rejected"), just distinguished in the audit log and
    // the copy sent to the user.
    const resubmitRequested = decision === "resubmit";
    const beforeStatus = verificationRequest.status;

    verificationRequest.status = approved ? "approved" : "rejected";
    verificationRequest.reviewedBy = user.id;
    verificationRequest.reviewNote = note || null;
    await verificationRequest.save();

    // The one place isVerified and verificationStatus are ever written
    // together (see the schema comment on User.isVerified).
    await User.findByIdAndUpdate(verificationRequest.user, {
      verificationStatus: approved ? "verified" : "rejected",
      isVerified: approved,
    });

    await ModerationAction.create({
      admin: user.id,
      action: approved ? "approve_verification" : resubmitRequested ? "request_resubmission" : "reject_verification",
      targetType: "VerificationRequest",
      targetId: verificationRequest._id,
      reason: note || null,
      ip: getRequestIp(request),
      before: { status: beforeStatus },
      after: { status: verificationRequest.status },
    });

    let title;
    let message;
    let type;
    if (approved) {
      title = "You're verified!";
      message = "Your identity has been verified. You'll now see a verified badge across Foundly.";
      type = "verification_approved";
    } else if (resubmitRequested) {
      title = "Please resubmit your verification";
      message = note
        ? `A moderator requested you resubmit your verification documents: ${note}`
        : "A moderator requested you resubmit your verification documents.";
      type = "verification_resubmission_requested";
    } else {
      title = "Verification rejected";
      message = note
        ? `Your verification request was rejected: ${note}`
        : "Your verification request was rejected.";
      type = "verification_rejected";
    }

    await notify({ recipient: verificationRequest.user, title, message, type });

    return success(
      undefined,
      approved ? "Verification approved" : resubmitRequested ? "Resubmission requested" : "Verification rejected"
    );
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Review verification error:", err);
    return error("Something went wrong while reviewing the verification request", 500);
  }
}
