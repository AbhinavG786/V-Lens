import mongoose, { Schema, InferSchemaType } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ["web", "mobile", "android", "ios"],
      default: "web",
    },
    isFavorite: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create a compound index to ensure a user can't add the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

type WishlistType = InferSchemaType<typeof wishlistSchema>;

export const Wishlist = mongoose.model<WishlistType>("Wishlist", wishlistSchema); 