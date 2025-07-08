import mongoose, { Schema, InferSchemaType } from "mongoose";

const sunglassesSchema = new Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    modelNumber: { type: String, unique: true },
    frameType: { type: String, enum: ["full-rim", "half-rim", "rimless"] },
    shape: { type: String, enum: ["round", "square", "rectangle", "aviator", "cat-eye"] },
    gender: { type: String, enum: ["men", "women", "unisex"], default: "unisex" },
    material: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number },
    colorsAvailable: [{ type: String }],
    sizes: [{ type: String, enum: ["S", "M", "L"] }],
    images: [{ type: String }],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    tryOn3DModel: { type: String },
    inventory: {
      sku: String,
      quantityAvailable: Number,
      location: String,
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

type Sunglass = InferSchemaType<typeof sunglassesSchema>;

export const Sunglass = mongoose.model<Sunglass>("Sunglass", sunglassesSchema); 