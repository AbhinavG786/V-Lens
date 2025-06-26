import mongoose, { Schema,InferSchemaType } from "mongoose";

const RecommendationSchema = new Schema({
  userId: {
    type:Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  recommendedProductIds: [
    {
      type:Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  source: {
    type: String,
    enum: ["ML", "Manual"],
    default: "ML",
  },
}, { timestamps: true });
type RecommendationType = InferSchemaType<typeof RecommendationSchema>;

export const Recommendation = mongoose.model<RecommendationType>("Recommendation", RecommendationSchema);
