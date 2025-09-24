import mongoose, { Schema, InferSchemaType } from "mongoose";

const StoreSchema = new Schema(
  {
    name: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    employeeCount: { type: Number, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    storeManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    warehouses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Warehouse",
      },
    ],
  },
  { timestamps: true }
);

StoreSchema.index({ location: "2dsphere" });

type StoreType = InferSchemaType<typeof StoreSchema>;
export const Store = mongoose.model<StoreType>("Store", StoreSchema);
