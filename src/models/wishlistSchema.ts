import mongoose, { Schema, InferSchemaType } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [ 
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product", 
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

type WishlistType = InferSchemaType<typeof wishlistSchema>;

export const Wishlist = mongoose.model<WishlistType>("Wishlist", wishlistSchema);
