import mongoose, { Schema, InferSchemaType } from "mongoose";

const sunglassesSchema = new Schema(
  {
    brand: {
      type: String,
      required: true,
    },
    frameType: {
      type: String,
      enum: ["full-rim", "half-rim", "rimless"],
      required: true,
    },
    lensShape: {
      type: String,
      enum: ["round", "square", "rectangle", "aviator", "cat-eye"],
      required: true,
    },
    material: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    color:
      {
        type: String,
        required: true,
      },
    stock: {
      type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    size: 
      {
        type: String,
        enum: ["S", "M", "L"],
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
  { timestamps: true }
);

type SunglassType = InferSchemaType<typeof sunglassesSchema>;

export const Sunglass = mongoose.model<SunglassType>("Sunglass", sunglassesSchema);
