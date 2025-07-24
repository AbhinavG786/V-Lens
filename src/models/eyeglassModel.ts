import mongoose, { Schema, InferSchemaType } from "mongoose";

const EyeglassModelSchema = new Schema(
  {
    modelName: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    frameType: {
      type: String,
      enum: ["full-rim", "half-rim", "rimless"],
      required: true,
    },
    frameShape: {
      type: String,
      enum: ["round", "square", "rectangular", "oval", "cat-eye", "aviator", "wayfarer"],
      required: true,
    },
    frameMaterial: {
      type: String,
      enum: ["acetate", "metal", "titanium", "plastic"],
      required: true,
    },
    frameColor: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    finalPrice: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

EyeglassModelSchema.index({ brand: 1, frameType: 1 });
EyeglassModelSchema.index({ gender: 1 });

type EyeglassModelType = InferSchemaType<typeof EyeglassModelSchema>;

export const EyeglassModel = mongoose.model<EyeglassModelType>("EyeglassModel", EyeglassModelSchema);