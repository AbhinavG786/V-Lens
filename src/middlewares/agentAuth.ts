import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import FirebaseAuthMiddleware from "./firebaseAuth";

class AgentAuthMiddleware {
  verifyAgentSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // First, verify the user session using the existing Firebase middleware
    await FirebaseAuthMiddleware.verifySessionCookie(req, res, async () => {
      try {
        const firebaseUID = req.user?.uid;
        
        if (!firebaseUID) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }

        // Check if user exists and is an agent
        const user = await User.findOne({ firebaseUID });
        
        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }

        if (!user.isAgent) {
          res.status(403).json({ error: "Agent access required" });
          return;
        }

        // Add agent info to request
        req.agent = {
          uid: firebaseUID,
          email: user.email,
          fullName: user.fullName,
          isAgent: user.isAgent
        };

        next();
      } catch (error) {
        console.error("Agent authentication error:", error);
        res.status(500).json({ error: "Internal server error during agent authentication" });
      }
    });
  };

  // Optional: Middleware to check if user is agent without requiring session verification
  checkAgentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const firebaseUID = req.user?.uid;
      
      if (!firebaseUID) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const user = await User.findOne({ firebaseUID });
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.isAgent) {
        res.status(403).json({ error: "Agent access required" });
        return;
      }

      // Add agent info to request
      req.agent = {
        uid: firebaseUID,
        email: user.email,
        fullName: user.fullName,
        isAgent: user.isAgent
      };

      next();
    } catch (error) {
      console.error("Agent status check error:", error);
      res.status(500).json({ error: "Internal server error during agent status check" });
    }
  };
}

export default new AgentAuthMiddleware();