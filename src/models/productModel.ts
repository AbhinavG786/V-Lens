import mongoose, { Schema, InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["eyeglasses", "sunglasses", "lenses", "accessories","frames"],
    },
    name: {
      type: String,
      required: true,
    },
    // brand: {
    //   type: String,
    //   required: true,
    // },
    // description: {
    //   type: String,
    // },
    // price: {
    //   type: Number,
    //   required: true,
    // },
    // discount: {
    //   type: Number,
    //   default: 0,
    // },
    // finalPrice: {
    //   type: Number,
    //   required: true,
    // },
    // images: [
    //   {
    //     type: String,
    //     required: true,
    //   },
    // ],
    // variants: [
    //   {
    //     color: { type: String },
    //     stock: { type: Number, default: 0 },
    //   },
    // ],
    tags: [
      {
        type: String,
      },
    ],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
      reviews: [
        // {
        //   userId: { type: Schema.Types.ObjectId, ref: "User" },
        //   rating: { type: Number },
        //   comment: { type: String },
        //   createdAt: { type: Date, default: Date.now },
        // },
        {
        type: Schema.Types.ObjectId,
        ref:"Review",
        }
      ],
    },
    // tryOn3DModel: {
    //   type: String, // URL to the 3D model file
    // },
    // gender: {
    //   type: String,
    //   enum: ["men", "women", "unisex"],
    //   default: "unisex",
    // },
    lensRef:{
      type: Schema.Types.ObjectId,
      ref: "Lens",
    },
    frameRef: {
      type: Schema.Types.ObjectId,
      ref: "Frame",
    },
    accessoriesRef: {
      type: Schema.Types.ObjectId,
      ref: "Accessories",
    },
    sunglassesRef: {
      type: Schema.Types.ObjectId,
      ref: "Sunglass",
    },
    eyeglassesRef: {
      type: Schema.Types.ObjectId,
      ref: "Eyeglasses",
    }
    // frameShape: {
    //   type: String,
    // },
    // material: {
    //   type: String,
    // },
  },
  { timestamps: true }
);

type ProductType = InferSchemaType<typeof productSchema>;

export const Product = mongoose.model<ProductType>("Product", productSchema);
