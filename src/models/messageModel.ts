import mongoose, { InferSchemaType, Schema } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    attachment: [
      {
        type: String,
      },
    ],
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "agent"],
      required: true,
    },
    roomId: {
       type: Schema.Types.ObjectId,
       ref:"Room",
      required: true,
    },
  },
  { timestamps: true }
);

type messageType = InferSchemaType<typeof messageSchema>;

export const Message = mongoose.model<messageType>("Message", messageSchema);
