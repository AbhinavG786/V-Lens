import mongoose, { Schema, InferSchemaType } from "mongoose";

const frameSchema = new Schema(
  {
    brand: {
      type: String,
      required: true,
    },
     description: {
      type: String,
      required: true, 
    },
     price: {
      type: Number,
      required: true,
    },
    shape: {
      type: String,
      required: true,
    },
    material: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    size: {
      type: String, 
      required: true,
    },
    stock: {
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
    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      default: "unisex",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId:{
      type:String,
      required: true,
    }
  },
  { timestamps: true }
);

type FrameType = InferSchemaType<typeof frameSchema>;

export const Frame = mongoose.model<FrameType>("Frame", frameSchema);
