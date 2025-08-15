import mongoose, { Schema, InferSchemaType } from "mongoose";

export enum PaymentStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
  REFUND_INITIATED = "refund_initiated",
  REFUNDED = "refunded",
  PARTIAL_REFUND = "partial_refund",
}

const PaymentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  razorpayOrderId: { type: String, required: true },
  transactionId: { type: String},
  status: { type: String, enum: Object.values(PaymentStatus), required: true },
  paidAt: { type: Date, default: null },
  refundHistory:[{
refundId: { type: String ,unique:true},
refundAmount: { type: Number,default:0 },
refundInitiatedAt: { type: Date, default: null },
  refundProcessedAt: { type: Date, default: null },
  }],
  refundedAmount: { type: Number, default: 0 },
},
{ timestamps: true });

type PaymentType = InferSchemaType<typeof PaymentSchema>;

export const Payment = mongoose.model<PaymentType>("Payment", PaymentSchema);
