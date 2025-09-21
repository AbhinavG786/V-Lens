import mongoose, { Schema, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      sparse: true, // allows multiple docs without phone field
      required: function (this: any): boolean {
        return this.loginMethod === "email";
      },
      default: undefined,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    isAgent: {
      type: Boolean,
      default: false,
    },
    isWarehouseManager: {
      type: Boolean,
      default: false,
    },
    currentLoad: {
      type: Number,
      default: 0,
    },
    maxLoad: {
      type: Number,
      default: 3,
    },
    loginMethod: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Wishlist",
      },
    ],
    prescriptions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Prescription",
      },
    ],
  },
  { timestamps: true }
);

type UserType = InferSchemaType<typeof userSchema>;

export const User = mongoose.model<UserType>("User", userSchema);
