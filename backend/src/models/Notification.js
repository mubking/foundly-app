import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Not constrained to an enum yet — no endpoint in this codebase
    // creates notifications so far, so the real set of types this needs
    // to support isn't established. Revisit once a create-path exists.
    type: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Optional — lets a notification point at whatever triggered it (e.g.
    // the item a claim was submitted/reviewed on, or the conversation a
    // message was sent in) so a client can navigate straight there instead
    // of just displaying text. Same polymorphic refPath pattern as
    // Claim.item/Report.target; null for any notification that isn't about
    // a specific item or conversation.
    targetType: {
      type: String,
      enum: ["LostItem", "FoundItem", "Conversation", "Claim", "Match"],
      default: null,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetType",
      default: null,
    },

    // Denormalized snapshot for rich rendering (notification list rows,
    // the real-time toast, and the push payload) without a per-notification
    // join back to the sender — only ever set for "new_message" (see
    // services/message.service.js); null for every other type.
    senderAvatar: {
      type: String,
      default: null,
    },

    // Same reasoning as senderAvatar — the item a "new_message" notification's
    // conversation is about, if any, snapshotted at send time.
    itemTitle: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Every query here filters by recipient and sorts by createdAt desc.
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
