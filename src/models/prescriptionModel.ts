import { Schema, model, InferSchemaType } from "mongoose";

const PrescriptionSchema = new Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

type PrescriptionType = InferSchemaType<typeof PrescriptionSchema>;

export const Prescription = model<PrescriptionType>(
  "Prescription",
  PrescriptionSchema
);
