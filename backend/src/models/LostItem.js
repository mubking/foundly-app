import mongoose from "mongoose";

const lostItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Phone",
        "Laptop",
        "Wallet",
        "Bag",
        "Keys",
        "Documents",
        "Jewelry",
        "Clothing",
        "Pet",
        "Other",
      ],
    },

    images: [
      {
        type: String,
      },
    ],

    location: {
      address: String,
      city: String,
      state: String,
      latitude: Number,
      longitude: Number,
    },

    dateLost: {
      type: Date,
      required: true,
    },

    reward: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["open", "matched", "claimed", "closed"],
      default: "open",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.LostItem ||
  mongoose.model("LostItem", lostItemSchema);