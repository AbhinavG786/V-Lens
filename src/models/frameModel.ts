import mongoose, { Schema, InferSchemaType } from "mongoose";

const frameSchema = new Schema(
  {
    name: {
      type: String,
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
    },
    size: {
      type: String, 
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
