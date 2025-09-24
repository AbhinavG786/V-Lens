import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import FirebaseAuthMiddleware from "./firebaseAuth";

class adminStoreWarehouseAuthMiddleware {
  verifyAdminStoreAndWarehouseSession = async (
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

        if (!user.isWarehouseManager && !user.isAdmin && !user.isStoreManager) {
          res.status(403).json({ error: "Warehouse Manager, Admin or Store Manager access required" });
          return;
        }

        // Add warehouse manager info to request
        req.warehouseManager = {
          uid: firebaseUID,
          email: user.email,
          fullName: user.fullName,
          isWarehouseManager: user.isWarehouseManager
        };

        req.admin = {
          uid: firebaseUID,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin
        };

        req.storeManager = {
          uid: firebaseUID,
          email: user.email,
          fullName: user.fullName,
          isStoreManager: user.isStoreManager
        };

        next();
      } catch (error) {
        console.error("Warehouse Manager/Admin/Store Manager authentication error:", error);
        res.status(500).json({ error: "Internal server error during warehouse manager/admin/store manager authentication" });
      }
    });
  };

  // Optional: Middleware to check if user is warehouse manager or admin or store manager without requiring session verification
  checkWarehouseManagerStoreOrAdminStatus = async (
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

      if (!user.isWarehouseManager && !user.isAdmin && !user.isStoreManager) {
        res.status(403).json({ error: "Warehouse Manager, Admin or Store Manager access required" });
        return;
      }

      // Add warehouse manager info to request
      req.warehouseManager = {
        uid: firebaseUID,
        email: user.email,
        fullName: user.fullName,
        isWarehouseManager: user.isWarehouseManager
      };

        req.admin = {
        uid: firebaseUID,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin
      };

        req.storeManager = {
        uid: firebaseUID,
        email: user.email,
        fullName: user.fullName,
        isStoreManager: user.isStoreManager
      };

      next();
    } catch (error) {
      console.error("Warehouse Manager/Admin/Store Manager status check error:", error);
      res.status(500).json({ error: "Internal server error during warehouse manager/admin/store manager status check" });
    }
  };
}

export default new adminStoreWarehouseAuthMiddleware();