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

    // System-generated context messages (e.g. "so-and-so submitted a claim
    // for X" — see claims/create/route.js) render via SystemMessage on the
    // client instead of a normal bubble, but still need a real `sender`
    // (the claimant, for that example) since the field is required — this
    // flag is what the client keys off of, not who `sender` happens to be.
    isSystem: {
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
