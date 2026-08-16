import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireActiveUser, AuthError } from "@/lib/auth";
import { createClaimSchema } from "@/validations/claim.validation";
import LostItem from "@/models/LostItem";
import FoundItem from "@/models/FoundItem";
import Claim from "@/models/Claim";
import Message from "@/models/Message";
import User from "@/models/User";
import { success, error } from "@/lib/response";
import { notify } from "@/lib/notifications";
import { findOrCreateConversation } from "@/services/message.service";
import { rateLimitOrError } from "@/lib/rateLimit";
import { withRequestLogging } from "@/lib/logger";

function formatSubmittedAt(date) {
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateStr} at ${timeStr}`;
}

// Maps the public "lost"/"found" wording (used everywhere else in the API)
// to the actual model to query and the model-name string Claim.itemType
// needs for its refPath to resolve populate() correctly.
const ITEM_LOOKUP = {
  lost: { Model: LostItem, modelName: "LostItem" },
  found: { Model: FoundItem, modelName: "FoundItem" },
};

async function handlePOST(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const limited = await rateLimitOrError({
      key: `claims-create:user:${user.id}`,
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

    const parsed = createClaimSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const { itemId, itemType, message, reward, proofImage } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return error("Invalid item ID", 400);
    }

    await connectDB();

    const { Model, modelName } = ITEM_LOOKUP[itemType];
    const item = await Model.findById(itemId).select("owner title").lean();

    if (!item) {
      return error("Item not found", 404);
    }

    // Not explicitly requested, but claiming your own reported item makes
    // no sense — flagging this as an added guard, not something asked for.
    if (item.owner.toString() === user.id) {
      return error("You cannot claim your own item", 400);
    }

    // Explicit pre-check for a clean 409 message. The unique index on
    // Claim (claimant, item) is the real guarantee — this just avoids
    // surfacing a raw duplicate-key error in the common case.
    const existingClaim = await Claim.findOne({ claimant: user.id, item: itemId }).lean();
    if (existingClaim) {
      return error("You have already submitted a claim for this item", 409);
    }

    const claim = await Claim.create({
      claimant: user.id,
      item: itemId,
      itemType: modelName,
      message,
      reward,
      proofImage,
    });

    // Seeds the claim's conversation immediately (reusing the same
    // find-or-create dedup message.service.js's own sendMessage path uses —
    // never a second conversation for this pair) with a system message, so
    // there's permanent context the moment the owner opens it, rather than
    // waiting on whoever messages first. When the owner later taps "Message
    // Claimant" from Claim Details, this exact conversation is what gets
    // reused.
    const claimant = await User.findById(user.id).select("firstName lastName").lean();
    const claimantName = claimant ? `${claimant.firstName} ${claimant.lastName}`.trim() : "Someone";

    const conversation = await findOrCreateConversation({
      participantAId: user.id,
      participantBId: item.owner.toString(),
      itemId,
      itemType,
    });

    // The authoritative link GET /api/chat/conversations/:id's evidence
    // lookup relies on (see services/conversation.service.js#findClaimForConversation
    // and the schema comment on Claim.conversation) — written before the
    // system message below so it's in place even if that next write fails.
    claim.conversation = conversation._id;
    await claim.save();

    const systemMessage = await Message.create({
      conversation: conversation._id,
      sender: user.id,
      text: `${claimantName} submitted a claim for "${item.title}" on ${formatSubmittedAt(new Date())}.`,
      isSystem: true,
    });

    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    await notify({
      recipient: item.owner,
      title: "New claim on your item",
      message: `${claimantName} submitted a claim for "${item.title}".`,
      type: "claim_submitted",
      // Points at the claim itself (not the item) so the owner's
      // notification deep-links straight to the Claim Details review
      // screen — see mobile/services/notifications.js's TARGET_ROUTES.
      targetType: "Claim",
      targetId: claim._id,
    });

    return success(
      {
        id: claim._id,
        claimant: claim.claimant,
        item: claim.item,
        type: itemType,
        message: claim.message,
        reward: claim.reward ?? null,
        proofImage: claim.proofImage ?? null,
        status: claim.status,
        createdAt: claim.createdAt,
      },
      "Claim submitted successfully",
      201
    );
  } catch (err) {
    // Race-condition fallback: two concurrent requests could both pass the
    // pre-check above before either commits. The unique index catches that
    // case here instead of letting it surface as a raw 500.
    if (err.code === 11000) {
      return error("You have already submitted a claim for this item", 409);
    }

    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Create claim error:", err);
    return error("Something went wrong while submitting the claim", 500);
  }
}

export const POST = withRequestLogging(handlePOST, { route: "/api/claims/create" });
