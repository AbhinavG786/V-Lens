import mongoose, { Schema, InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1 }); // index for productId to optimize queries / fetching all reviews for a product 
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // one user can review a product only once

type ReviewType = InferSchemaType<typeof reviewSchema>;

export const Review = mongoose.model<ReviewType>("Review", reviewSchema);
