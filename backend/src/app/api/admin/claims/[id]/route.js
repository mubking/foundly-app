import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { AuthError } from "@/lib/auth";
import Claim from "@/models/Claim";
// Not used directly, but Claim.item/refPath and item.owner only store
// `ref:`/`refPath:` strings — Mongoose needs both schemas registered in
// this module's scope before nested .populate() can resolve them.
import "@/models/LostItem";
import "@/models/FoundItem";
import "@/models/User";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { success, error } from "@/lib/response";

const CLAIMANT_SELECT = "firstName lastName email phone avatar isVerified verificationStatus createdAt";
const ITEM_SELECT = "title description images status category location dateLost dateFound reward owner";
const OWNER_SELECT = "firstName lastName email avatar isVerified isActive banned";
const MESSAGE_LIMIT = 20;

export async function GET(request, context) {
  try {
    try {
      await requireAdmin(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid claim ID", 400);
    }

    await connectDB();

    const claim = await Claim.findById(id)
      .populate({ path: "claimant", select: CLAIMANT_SELECT })
      .populate({ path: "item", select: ITEM_SELECT, populate: { path: "owner", select: OWNER_SELECT } })
      .lean();

    if (!claim) {
      return error("Claim not found", 404);
    }

    // "Relevant claim history" — other claims on the same item (siblings,
    // any status) and this claimant's other claims elsewhere, so the admin
    // can spot a pattern (e.g. a claimant with many rejected claims) without
    // leaving the drawer.
    const [itemHistory, claimantHistory, conversation] = await Promise.all([
      Claim.find({ item: claim.item?._id, itemType: claim.itemType, _id: { $ne: claim._id } })
        .populate({ path: "claimant", select: "firstName lastName" })
        .select("status message createdAt claimant")
        .sort({ createdAt: -1 })
        .lean(),
      Claim.find({ claimant: claim.claimant?._id, _id: { $ne: claim._id } })
        .populate({ path: "item", select: "title" })
        .select("status itemType item createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      claim.conversation ? Conversation.findById(claim.conversation).lean() : null,
    ]);

    let messages = [];
    if (conversation) {
      messages = await Message.find({ conversation: conversation._id })
        .populate({ path: "sender", select: "firstName lastName avatar" })
        .sort({ createdAt: -1 })
        .limit(MESSAGE_LIMIT)
        .lean();
      messages.reverse();
    }

    return success({
      claim: {
        id: claim._id,
        status: claim.status,
        message: claim.message,
        reward: claim.reward ?? null,
        proofImage: claim.proofImage ?? null,
        createdAt: claim.createdAt,
        claimant: claim.claimant,
        item: claim.item
          ? { ...claim.item, type: claim.itemType === "LostItem" ? "lost" : "found" }
          : null,
      },
      itemHistory: itemHistory.map((c) => ({
        id: c._id,
        status: c.status,
        message: c.message,
        createdAt: c.createdAt,
        claimant: c.claimant,
      })),
      claimantHistory: claimantHistory.map((c) => ({
        id: c._id,
        status: c.status,
        createdAt: c.createdAt,
        item: c.item,
        type: c.itemType === "LostItem" ? "lost" : "found",
      })),
      conversation: conversation ? { id: conversation._id } : null,
      messages: messages.map((m) => ({
        id: m._id,
        text: m.text,
        isSystem: m.isSystem,
        createdAt: m.createdAt,
        sender: m.sender,
      })),
    });
  } catch (err) {
    console.error("Get admin claim error:", err);
    return error("Something went wrong while fetching this claim", 500);
  }
}
