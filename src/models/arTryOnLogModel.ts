import mongoose, { Schema, InferSchemaType } from "mongoose";

const arTryOnLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sunglassesId: { type: Schema.Types.ObjectId, ref: "Sunglass", required: true },
    deviceType: { type: String, enum: ["mobile", "desktop", "tablet"], default: "mobile" },
    sessionId: { type: String },
    feedback: { type: String },
    faceAlignmentScore: { type: Number, min: 0, max: 1 },
    location: {
      ip: { type: String },
      city: { type: String },
      country: { type: String },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

type ARTryOnLog = InferSchemaType<typeof arTryOnLogSchema>;

export const ARTryOnLog = mongoose.model<ARTryOnLog>("ARTryOnLog", arTryOnLogSchema); 