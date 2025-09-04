import mongoose,{InferSchemaType} from "mongoose";

const refundRequestSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true }, // in paise
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "initiated", "processed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

type RefundRequestType = InferSchemaType<typeof refundRequestSchema>;

export const RefundRequest = mongoose.model<RefundRequestType>("RefundRequest", refundRequestSchema);
