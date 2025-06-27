import mongoose, { Schema, InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/, // Valid Indian mobile number
    },
    pinCode: {
      type: String,
      required: true,
      match: /^\d{6}$/, // Indian 6-digit pincode
    },
    locality: {
      type: String,
      required: true,
    },
    addressLine: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

type AddressType = InferSchemaType<typeof addressSchema>;
export const Address = mongoose.model<AddressType>("Address", addressSchema);
