import mongoose, { Schema, InferSchemaType } from "mongoose";

const AccessoriesSchema = new Schema(
  {
    brand: {
      type: String,
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

type AccessoriesType = InferSchemaType<typeof AccessoriesSchema>;

export const Accessories = mongoose.model<AccessoriesType>("Accessories", AccessoriesSchema);
