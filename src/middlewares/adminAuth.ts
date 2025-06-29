import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import FirebaseAuthMiddleware from "./firebaseAuth";

class AdminAuthMiddleware {
  verifyAdminSession = async (
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

        // Check if user exists and is an admin
        const user = await User.findOne({ firebaseUID });
        
        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }

        if (!user.isAdmin) {
          res.status(403).json({ error: "Admin access required" });
          return;
        }

        // Add admin info to request
        req.admin = {
          uid: firebaseUID,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin
        };

        next();
      } catch (error) {
        console.error("Admin authentication error:", error);
        res.status(500).json({ error: "Internal server error during admin authentication" });
      }
    });
  };

  // Optional: Middleware to check if user is admin without requiring session verification
  checkAdminStatus = async (
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

      if (!user.isAdmin) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      // Add admin info to request
      req.admin = {
        uid: firebaseUID,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin
      };

      next();
    } catch (error) {
      console.error("Admin status check error:", error);
      res.status(500).json({ error: "Internal server error during admin status check" });
    }
  };
}

export default new AdminAuthMiddleware(); 