import mongoose from "mongoose";

const foundItemSchema = new mongoose.Schema(
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

    dateFound: {
      type: Date,
      required: true,
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

export default mongoose.models.FoundItem ||
  mongoose.model("FoundItem", foundItemSchema);
