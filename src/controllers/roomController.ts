import { Room } from "../models/roomModel";
import { User } from "../models/userModel";
import { Message } from "../models/messageModel";
import {Feedback} from "../models/agentFeedbackModel"
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import { onlineAgents } from "../utils/socket-server";
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
      const availableAgents = await User.find(
        {
          isAdmin: true,
          isAvailable: true,
          _id: { $in: Array.from(onlineAgents.keys()) },
        },
        { _id: 1 }
      );

      if (availableAgents.length === 0) {
        res.status(500).json({ error: "No available agents online" });
        return;
      }

      // const agents = await User.find({ isAdmin: true }, { _id: 1 });

      // if (agents.length === 0) {
      //   res.status(500).json({ error: "No available agents" });
      //   return;
      // }

      const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
      const agentId = randomAgent._id;

      let room = await Room.findOne({
        participants: { $size: 2, $all: [userId, agentId] },
        isChatEnded: false,
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

  endChat = async (req: express.Request, res: express.Response) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId);
    if (!room) {
       res.status(404).json({ error: "Room not found" });
       return
    }

    room.isChatEnded = true;
    await room.save();

    //frontend guys needs to emit this event to all users in the room to tell them that the chat has ended
    io.to(roomId).emit("chat-ended", { msg: "Chat has been ended by user." });

    res.status(200).json({ message: "Chat ended successfully" });
  } catch (error) {
    console.error("Error ending chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

submitFeedback = async (req: express.Request, res: express.Response) => {
  const { roomId, rating, comment } = req.body;
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

  if (!roomId || !rating) {
     res.status(400).json({ error: "Missing required fields" });
     return
  }

  try {
    const room = await Room.findById(roomId);
    if (!room || !room.isChatEnded) {
       res.status(400).json({ error: "Chat not ended or room not found" });
       return
    }

    if (room.feedbackGiven) {
       res.status(400).json({ error: "Feedback already submitted" });
       return
    }

    if (!room.participants.includes(userId)) {
      res.status(403).json({ error: "User not part of the room" });
      return;
    }

    const feedback=new Feedback({
      roomId,
      agentId: room.agentAssigned,
      userId,
      rating,
      comment,
    })
    await feedback.save();
    room.feedbackGiven = true;
    await room.save();

    res.status(200).json({ message: "Feedback recorded successfully" });
  } catch (err) {
    console.error("Feedback error:", err);
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
          } else if (
            result &&
            typeof result === "object" &&
            "secure_url" in result
          ) {
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

  getRoomMessages = async (req: express.Request, res: express.Response) => {
    const { roomId } = req.params;
    if (!roomId) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }
    try {
      const messages = await Message.find({ roomId })
        .populate("senderId", "fullName email")
        .sort({ createdAt: 1 });
        if(!messages || messages.length === 0) {
          res.status(404).json({ error: "No messages found for this room" });
          return;
        }
      res.status(200).json(messages);
  }
  catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
}
}

export default new RoomController();
