import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Polymorphic reference: resolves against whichever model name is
    // stored in `itemType` (LostItem or FoundItem), so .populate("item")
    // works correctly regardless of which collection the item lives in.
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },

    itemType: {
      type: String,
      required: true,
      enum: ["LostItem", "FoundItem"],
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    reward: {
      type: Number,
      min: 0,
    },

    // Cloudinary URL of an optional proof-of-ownership photo, uploaded via
    // POST /api/upload/image with folder "claims" before this is created.
    proofImage: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // The claimant/owner conversation this claim was filed into — set once,
    // right after creation, in claims/create/route.js (via
    // message.service.js#findOrCreateConversation). This is the
    // authoritative link services/conversation.service.js#findClaimForConversation
    // uses to resolve "which claim is this chat thread about" for the chat
    // screen's evidence card: deliberately NOT re-derived from
    // Conversation.item + participants, because Conversation.item is set
    // once at conversation creation and conversations are matched purely by
    // participant pair — two users who'd already messaged about a *different*
    // item before this claim would make that inference resolve the wrong
    // claim (or none). Nullable only for the moment between Claim.create()
    // and that follow-up write.
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A user may only submit one claim per item.
claimSchema.index({ claimant: 1, item: 1 }, { unique: true });
// Approving/rejecting a claim looks up (and bulk-rejects) sibling claims
// by item + status; claims/mine filters purely by item.
claimSchema.index({ item: 1, status: 1 });
// GET /api/chat/conversations/:id's evidence lookup — see the schema
// comment on `conversation` above.
claimSchema.index({ conversation: 1 });

export default mongoose.models.Claim || mongoose.model("Claim", claimSchema);
