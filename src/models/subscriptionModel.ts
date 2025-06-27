import mongoose, { Schema, InferSchemaType } from "mongoose";

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    auth: {
      type: String,
      required: true,
    },
    p256dh: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

type SubscriptionType = InferSchemaType<typeof subscriptionSchema>;

export const Subscription = mongoose.model<SubscriptionType>(
  "Subscription",
  subscriptionSchema
);
