import { User } from "../models/userModel";
import { Feedback } from "../models/agentFeedbackModel";
import mongoose from "mongoose";
import express from "express";
import admin from "../firebase/firebaseInit";

class AgentController {
createAgent=async(req:express.Request,res:express.Response)=>{
      // dont keep isAgent and isAdmin true together, only one should be true at a time, also give currentLoad and maxLoad values only during agent signup
      // if isAdmin is true, then currentLoad and maxLoad should not be given,
      const { fullName,idToken ,phone,isAdmin=false,isAgent=true,currentLoad=0,maxLoad=3} = req.body;
      if (!idToken) {
        res.status(400).json({ error: "ID token required" });
        return;
      }
  
      try {
  
        const decoded = await admin.auth().verifyIdToken(idToken, true);
        const provider = decoded.firebase?.sign_in_provider; // "google.com" or "password"
  
        let user = await User.findOne({ firebaseUID: decoded.uid });
        if (!user) {
         const Name=decoded.name || fullName
         if (!Name) {
       res.status(400).json({ error: "Full name is required for new user." });
       return
    }
    if(!phone) {
       res.status(400).json({ error: "Phone number is required for new user." });
       return
    }
     const globalPhoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!globalPhoneRegex.test(phone)) {
     res.status(400).json({ error: "Invalid phone number. Use E.164 format, e.g., +14155552671" });
     return
  }
          user = await User.create({
            firebaseUID: decoded.uid,
            email: decoded.email,
            fullName: Name,
            loginMethod: provider === "google.com" ? "google" : "email",
            phone: phone,
            isAdmin: isAdmin,
            isAgent: isAgent,
            currentLoad: currentLoad,
            maxLoad: maxLoad,
            addresses: [],
            wishlist: [],
            prescriptions: [],
          });
        }
        else{
          res.status(409).json({ error: "User already exists" });
          return
        }
  
        res.status(200).json({ message: "Agent creation successful", user });
      } catch (error) {
        console.error("Agent creation failed:", error);
        res.status(401).json({ error: "Failed to create agent" });
      }
    };

  toggleAvailability = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(400).json({ error: "User not authenticated" });
      return;
    }
    try {
      const user = await User.findOne({ firebaseUID, isAgent: true });
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

  getAgentLiveAvailabilityStatus = async (req: express.Request, res: express.Response) => {
    const { agentId } = req.params;
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
      res.status(200).json({ isAvailable: agent.isAvailable });
    } catch (error) {
      console.error("Error fetching agent availability status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new AgentController();
