import mongoose, { Schema, InferSchemaType } from "mongoose";

const inventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    SKU: {
      type: String,
      required: true,
      unique: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    threshold: {
      type: Number,
      required: true,
      default: 5,
    },
    locations: [
      {
        warehouse: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

type InventoryType = InferSchemaType<typeof inventorySchema>;
export const Inventory = mongoose.model<InventoryType>("Inventory", inventorySchema);