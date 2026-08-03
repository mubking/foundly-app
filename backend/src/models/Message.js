import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: 2000,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Every query here filters by conversation and sorts chronologically.
messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
