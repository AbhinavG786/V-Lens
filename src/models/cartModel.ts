import mongoose, { Schema, InferSchemaType, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const cartSchema = new Schema(
  {
    _id: {
      type: String,
      default: uuidv4, 
    },
    userId: {
      type: String,
      required: true,
      ref: "User", 
    },
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
  { timestamps: true }
);

cartSchema.index({ userId: 1, productId: 1 }, { unique: true });

type CartType = InferSchemaType<typeof cartSchema>;

export const Cart = model<CartType>("Cart", cartSchema);
