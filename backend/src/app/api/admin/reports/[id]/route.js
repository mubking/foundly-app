import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { updateReportStatusSchema } from "@/validations/moderation.validation";
import Report from "@/models/Report";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";

export async function PATCH(request, context) {
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
      return error("Invalid report ID", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = updateReportStatusSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const report = await Report.findById(id);
    if (!report) {
      return error("Report not found", 404);
    }

    const { status } = parsed.data;
    const beforeStatus = report.status;
    report.status = status;
    await report.save();

    await ModerationAction.create({
      admin: user.id,
      action: status === "dismissed" ? "dismiss_report" : "approve_report",
      targetType: "Report",
      targetId: report._id,
      ip: getRequestIp(request),
      before: { status: beforeStatus },
      after: { status },
    });

    return success(undefined, "Report updated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Update report error:", err);
    return error("Something went wrong while updating the report", 500);
  }
}
