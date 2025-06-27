import mongoose, { Schema, InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ["LOW_STOCK", "NEW_ORDER", "ORDER_SHIPPED", "PRICE_DROP", "NEW_MESSAGE"],
      required: true,
    },
    channel: {
      type: [String],
      enum: ["email", "sms", "push", "web"],
      default: "web",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

type NotificationType = InferSchemaType<typeof notificationSchema>;
export const Notification = mongoose.model<NotificationType>("Notification", notificationSchema);



//Notification Schema
//yahi schema daal raha fir ekbaar check kar lena