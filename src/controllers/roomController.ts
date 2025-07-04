import { Room } from "../models/roomModel";
import { User } from "../models/userModel";
import { Message } from "../models/messageModel";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import { io } from "../utils/socket-server";
import express from "express";

class RoomController {
  getOrCreateRoom = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(400).json({ error: "User not authenticated" });
      return;
    }

    const currentUser = await User.findOne({ firebaseUID });

    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const userId = currentUser._id;

    try {
      const agents = await User.find({ isAdmin: true }, { _id: 1 });

      if (agents.length === 0) {
        res.status(500).json({ error: "No available agents" });
        return;
      }

      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const agentId = randomAgent._id;

      let room = await Room.findOne({
        participants: { $size: 2, $all: [userId, agentId] },
      });

      if (!room) {
        room = await Room.create({
          participants: [userId, agentId],
          agentAssigned: agentId,
        });
      }

      res.status(200).json(room);
    } catch (error) {
      console.error("Failed to create/get room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  createMessage = async (req: express.Request, res: express.Response) => {
    try {
      const { senderId, roomId, content, senderRole } = req.body;
      const folderType = req.body.folder || req.query.folder || "others";

      if (!senderId || !roomId || !senderRole) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room || !room.participants.includes(senderId)) {
        res
          .status(404)
          .json({ error: "Room not found or user not part of the room" });
        return;
      }

      const attachments: string[] = [];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files as Express.Multer.File[]) {
          const result = await uploadBufferToCloudinary(
            file.buffer,
            file.originalname,
            folderType
          );
          if (typeof result === "string") {
            attachments.push(result);
          } else if (result && typeof result === "object" && "secure_url" in result) {
            attachments.push(result.secure_url);
          }
        }
      }

      const message = await Message.create({
        senderId,
        roomId,
        content,
        senderRole,
        attachment: attachments,
      });

      if (message) {
        io.to(roomId).emit("receive-message", {
          message,
          msg: "received message",
        });
        res.status(201).json({ message });
      } else {
        res.status(500).json({ error: "Failed to create message" });
      }
    } catch (err) {
      console.error("Message creation failed:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  };
}

export default new RoomController();
