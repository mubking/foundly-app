import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Always exactly two — this is a 1:1 chat, not a group thread.
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2,
        message: "A conversation must have exactly two participants",
      },
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Every "find the conversation between these two users" lookup filters by
// participants; every inbox listing sorts by updatedAt desc.
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export default mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
