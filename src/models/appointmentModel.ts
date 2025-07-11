import mongoose, { Schema, InferSchemaType } from "mongoose";

const appointmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["store", "home"],
      required: true,
    },
    storeLocation: {
      type: String,
    },
    address: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

type AppointmentType = InferSchemaType<typeof appointmentSchema>;

export const Appointment = mongoose.model<AppointmentType>(
  "Appointment",
  appointmentSchema
);