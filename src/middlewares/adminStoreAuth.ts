import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import FirebaseAuthMiddleware from "./firebaseAuth";

class adminStoreAuthMiddleware {
  verifyAdminAndStoreSession = async (
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

        if (!user.isStoreManager && !user.isAdmin) {
          res.status(403).json({ error: "Store Manager or Admin access required" });
          return;
        }

        // Add store manager info to request
        req.storeManager = {
          uid: firebaseUID,
          email: user.email,
          fullName: user.fullName,
          isStoreManager: user.isStoreManager
        };

        req.admin = {
          uid: firebaseUID,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin
        };

        next();
      } catch (error) {
        console.error("Store Manager/Admin authentication error:", error);
        res.status(500).json({ error: "Internal server error during store manager/admin authentication" });
      }
    });
  };

  // Optional: Middleware to check if user is store manager or admin without requiring session verification
  checkStoreManagerOrAdminStatus = async (
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

      if (!user.isStoreManager && !user.isAdmin) {
        res.status(403).json({ error: "Store Manager or Admin access required" });
        return;
      }

      // Add store manager info to request
      req.storeManager = {
        uid: firebaseUID,
        email: user.email,
        fullName: user.fullName,
        isStoreManager: user.isStoreManager
      };

        req.admin = {
        uid: firebaseUID,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin
      };

      next();
    } catch (error) {
      console.error("Store Manager/Admin status check error:", error);
      res.status(500).json({ error: "Internal server error during store manager/admin status check" });
    }
  };
}

export default new adminStoreAuthMiddleware();