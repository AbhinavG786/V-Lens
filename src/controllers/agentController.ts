import { User } from "../models/userModel";
import { Feedback } from "../models/agentFeedbackModel";
import mongoose from "mongoose";
import express from "express";

class AgentController {
  toggleAvailability = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(400).json({ error: "User not authenticated" });
      return;
    }
    try {
      const user = await User.findOne({ firebaseUID, isAdmin: true });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.isAvailable = !user.isAvailable;
      await user.save();
      res
        .status(200)
        .json({ message: `Availability toggled to ${user.isAvailable}` });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.error("Error toggling availability:", error);
    }
  };

  getAgentRatingStats = async (req: express.Request, res: express.Response) => {
    const { agentId } = req.params;
    if (!agentId) {
      res.status(400).json({ error: "Agent ID is required" });
      return;
    }
    try {
      const stats = await Feedback.aggregate([
        { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
        {
          $group: {
            _id: "$agentId",
            averageRating: { $avg: "$rating" },
            totalFeedbacks: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json(stats[0] || { averageRating: 0, totalFeedbacks: 0 });
    } catch (error) {
      console.error("Error fetching agent rating stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getAllAgents = async (req: express.Request, res: express.Response) => {
    const {skip, take} = req.pagination!;
    try {
      const agents = await User.find({ isAgent: true }).skip(Number(skip)).limit(Number(take));
      const total = await User.countDocuments({ isAgent: true });
      res.status(200).json({
        data: agents,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getAllAvailableAgents = async (
    req: express.Request,
    res: express.Response
  ) => {
    const {skip,take} = req.pagination!;
    try {
      const agents = await User.find({ isAgent: true, isAvailable: true }).skip(Number(skip)).limit(Number(take));
      const total = await User.countDocuments({ isAgent: true, isAvailable: true });
      res.status(200).json({
        data: agents,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching available agents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  updateAgentProperties = async (req: express.Request, res: express.Response) => {
    const { agentId } = req.params;
    const { currentLoad, maxLoad } = req.body;
    if (!agentId) {
      res.status(400).json({ error: "Agent ID is required" });
      return;
    }
    try {
      const agent = await User.findById(agentId);
      if (!agent || !agent.isAgent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }

      if (currentLoad !== undefined) agent.currentLoad = currentLoad;
      if (maxLoad !== undefined) agent.maxLoad = maxLoad;

      await agent.save();
      res.status(200).json({ message: "Agent properties updated successfully" });
    } catch (error) {
      console.error("Error updating agent properties:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new AgentController();
