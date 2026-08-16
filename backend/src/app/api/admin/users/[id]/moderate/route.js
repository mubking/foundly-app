import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import { getRequestIp } from "@/lib/requestIp";
import { moderateUserSchema } from "@/validations/moderation.validation";
import User from "@/models/User";
import ModerationAction from "@/models/ModerationAction";
import { success, error } from "@/lib/response";
import { notify } from "@/lib/notifications";

const ACTION_TO_LOG = {
  warn: "warn_user",
  suspend: "suspend_account",
  reactivate: "reactivate_account",
  ban: "ban_account",
  unban: "unban_account",
  verify: "verify_account",
  unverify: "unverify_account",
};

const NOTIFICATION_COPY = {
  warn: {
    title: "You've received a warning",
    type: "account_warned",
    build: (reason) =>
      reason ? `A moderator issued you a warning: ${reason}` : "A moderator issued you a warning.",
  },
  suspend: {
    title: "Your account has been suspended",
    type: "account_suspended",
    build: (reason) =>
      reason ? `Your account was suspended: ${reason}` : "Your account was suspended by a moderator.",
  },
  reactivate: {
    title: "Your account has been reactivated",
    type: "account_reactivated",
    build: () => "Your account has been reactivated and you can sign in again.",
  },
  ban: {
    title: "Your account has been banned",
    type: "account_banned",
    build: (reason) =>
      reason ? `Your account was banned: ${reason}` : "Your account was banned by a moderator.",
  },
  unban: {
    title: "Your account has been unbanned",
    type: "account_unbanned",
    build: () => "Your account has been unbanned and you can sign in again.",
  },
  verify: {
    title: "You're verified!",
    type: "account_verified",
    build: () => "A moderator has manually verified your account. You'll now see a verified badge across Foundly.",
  },
  unverify: {
    title: "Your verification badge was removed",
    type: "account_unverified",
    build: (reason) =>
      reason ? `Your verification badge was removed: ${reason}` : "Your verification badge was removed by a moderator.",
  },
};

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
      return error("Invalid user ID", 400);
    }

    if (id === user.id) {
      return error("You cannot moderate your own account", 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = moderateUserSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    await connectDB();

    const target = await User.findById(id);
    if (!target) {
      return error("User not found", 404);
    }

    const { action, reason } = parsed.data;

    if (action === "reactivate" && target.banned) {
      return error("This user is banned — unban them before reactivating", 400);
    }

    const before = { isActive: target.isActive, banned: target.banned, isVerified: target.isVerified, verificationStatus: target.verificationStatus };

    if (action === "suspend") target.isActive = false;
    if (action === "reactivate") target.isActive = true;
    if (action === "ban") {
      target.isActive = false;
      target.banned = true;
    }
    if (action === "unban") {
      target.isActive = true;
      target.banned = false;
    }
    if (action === "verify") {
      target.isVerified = true;
      target.verificationStatus = "verified";
    }
    if (action === "unverify") {
      target.isVerified = false;
      target.verificationStatus = "unverified";
    }
    // "warn" doesn't change account state — it's logged + notified only.
    if (action !== "warn") await target.save();

    await ModerationAction.create({
      admin: user.id,
      action: ACTION_TO_LOG[action],
      targetType: "User",
      targetId: target._id,
      reason: reason || null,
      ip: getRequestIp(request),
      before,
      after: { isActive: target.isActive, banned: target.banned, isVerified: target.isVerified, verificationStatus: target.verificationStatus },
    });

    const copy = NOTIFICATION_COPY[action];
    await notify({
      recipient: target._id,
      title: copy.title,
      message: copy.build(reason),
      type: copy.type,
    });

    return success(undefined, "User moderated successfully");
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Moderate user error:", err);
    return error("Something went wrong while moderating this user", 500);
  }
}
