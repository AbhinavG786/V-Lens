import mongoose, { Schema, InferSchemaType } from "mongoose";

const roomSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", 
        required: true,
      },
    ],
    agentAssigned: {
      type: Schema.Types.ObjectId,
      ref: "User", 
    },
  },
  { timestamps: true }
);

roomSchema.index({ participants: 1 });


type RoomType = InferSchemaType<typeof roomSchema>;

export const Room = mongoose.model<RoomType>("Room", roomSchema);
