import { Room } from "../models/roomModel";
import { User } from "../models/userModel";
import express from "express";
import mongoose from "mongoose";

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
       return
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
          participants: [firebaseUID, agentId],
          agentAssigned: agentId,
        });
      }

      res.status(200).json(room);
    } catch (error) {
      console.error("Failed to create/get room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default new RoomController();
