import mongoose, { Schema, InferSchemaType } from "mongoose";

const warehouseSchema = new Schema(
  {
    warehouseName: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    // lensQuantity: {
    //   type: Number,
    // },
    // frameQuantity: {
    //   type: Number,
    // },
    // sunglassQuantity: {
    //   type: Number,
    // },
    // eyeglassQuantity: {
    //   type: Number,
    // },
    // accessoryQuantity: {
    //   type: Number,
    // },
    contactNumber: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    warehouseManager:{
      type:Schema.Types.ObjectId,
      ref:"User",
    }
  },
  {
    timestamps: true,
  }
);

type WarehouseType = InferSchemaType<typeof warehouseSchema>;

export const Warehouse = mongoose.model<WarehouseType>(
  "Warehouse",
  warehouseSchema
);
