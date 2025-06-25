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
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "staff"],
      default: "user",
    },
    loginMethod: {
      type: String,
      enum: ["email", "google"],
      default: "email",
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
