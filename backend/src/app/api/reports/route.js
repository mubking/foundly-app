import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { rateLimitOrError } from "@/lib/rateLimit";
import { createReportSchema } from "@/validations/report.validation";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import User from "@/models/User";
import Report from "@/models/Report";
import { success, error } from "@/lib/response";
import { notify } from "@/lib/notifications";
import { evaluateReportCreated } from "@/services/spam-detection.service";

// Maps the public "lost"/"found"/"user" wording to the actual model to
// query and the model-name string Report.targetType needs for its
// refPath to resolve populate() correctly.
const TARGET_LOOKUP = {
  lost: { Model: LostItem, modelName: "LostItem" },
  found: { Model: FoundItem, modelName: "FoundItem" },
  user: { Model: User, modelName: "User" },
};

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
      key: `reports:user:${user.id}`,
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

    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const { targetType, targetId, reason, description } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return error("Invalid target ID", 400);
    }

    await connectDB();

    const { Model, modelName } = TARGET_LOOKUP[targetType];
    const target = await Model.findById(targetId).select("owner").lean();

    if (!target) {
      return error(targetType === "user" ? "User not found" : "Item not found", 404);
    }

    const targetOwnerId = targetType === "user" ? target._id.toString() : target.owner?.toString();
    if (targetOwnerId === user.id) {
      return error(
        `You cannot report your own ${targetType === "user" ? "account" : "item"}`,
        400
      );
    }

    let report;
    try {
      report = await Report.create({
        reporter: user.id,
        target: targetId,
        targetType: modelName,
        reason,
        description: description || null,
      });
    } catch (err) {
      // Partial unique index on {reporter, target, status: "pending"} —
      // one open report per (reporter, target) at a time.
      if (err.code === 11000) {
        return error("You've already reported this — it's still pending review", 409);
      }
      throw err;
    }

    // Best-effort side effects: the report itself is already committed by
    // this point, so neither of these should turn a successful submission
    // into a 500.
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    await Promise.all(
      admins.map((admin) =>
        notify({
          recipient: admin._id,
          title: targetType === "user" ? "New user report" : "New listing report",
          message: `A ${targetType === "user" ? "user" : "listing"} was reported for: ${reason}.`,
          type: targetType === "user" ? "user_reported" : "listing_reported",
        })
      )
    );

    if (targetType === "user") {
      evaluateReportCreated(targetId);
    }

    return success(
      {
        id: report._id,
        reporter: report.reporter,
        target: report.target,
        targetType,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt,
      },
      "Report submitted successfully",
      201
    );
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Create report error:", err);
    return error("Something went wrong while submitting the report", 500);
  }
}
