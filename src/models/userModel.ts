import mongoose, { Schema, InferSchemaType } from "mongoose";
import { ref } from "process";
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
    phone:{
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
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
