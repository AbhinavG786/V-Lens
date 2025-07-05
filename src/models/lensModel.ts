import mongoose, { Schema, InferSchemaType } from "mongoose";

const LensSchema = new Schema(
  {
    brand: {
      type: String,
      required: true,
    },
    color:{
      type: String,
      required: true,
    },
    power:{
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["contact", "glasses", "sunglasses"],
      required: true,
    },
    price: {
      type: Number,
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
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId:{
      type:String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

type Lens = InferSchemaType<typeof LensSchema>;

export const Lens = mongoose.model("Lens", LensSchema);
