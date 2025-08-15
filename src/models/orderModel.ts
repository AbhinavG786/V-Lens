import mongoose, { Schema, InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    gstAmount: {
      type: Number,
      required: true,
    }, // GST per unit
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const gstDetailsSchema = new Schema({
  isGSTPurchase: {
    type: Boolean,
    default: false,
  },
  gstNumber: {
    type: String,
  },
  companyName: {
    type: String,
  },
  registrationNumber: {
    type: String,
  },
  companyAddress: {
    type: String,
  },
  gstRate: {
    type: Number,
    default: 0,
  },
  gstAmount: {
    type: Number,
    default: 0,
  }, // total GST amount
});

const orderSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    subTotalAmount: {
      type: Number,
      required: true,
    },
    invoiceUrl: {
      type: String,
    },
    gstDetails: {
      type: gstDetailsSchema,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    billingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "upi", "net_banking", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "partial"],
      default: "pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
    }, // Sum of successful payments
    paidAt: {
      type: Date,
    },
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ], // all attempts linked
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
    },
    trackingNumber: {
      type: String,
    },
    estimatedDelivery: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });

export type OrderType = InferSchemaType<typeof orderSchema>;

export const Order = mongoose.model<OrderType>("Order", orderSchema);
