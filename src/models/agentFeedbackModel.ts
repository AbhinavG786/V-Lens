import mongoose, { Schema, InferSchemaType } from "mongoose";

const feedbackSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true }
);

type FeedbackType = InferSchemaType<typeof feedbackSchema>;

export const Feedback = mongoose.model<FeedbackType>(
  "Feedback",
  feedbackSchema
);
