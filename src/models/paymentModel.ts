import mongoose, { Schema, InferSchemaType } from 'mongoose';

export enum PaymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

const PaymentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  transactionId: { type: String, required: true },
  status: { type: String, enum: Object.values(PaymentStatus), required: true },
  paidAt: { type: Date, default: Date.now },
});

type PaymentType = InferSchemaType<typeof PaymentSchema>;

export const Payment=mongoose.model<PaymentType>('Payment', PaymentSchema);