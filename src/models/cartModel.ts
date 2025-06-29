import mongoose, { Schema, InferSchemaType, model } from "mongoose";
 
const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 }, { unique: true });

type CartType = InferSchemaType<typeof cartSchema>;

export const Cart = model<CartType>("Cart", cartSchema);
