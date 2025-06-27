import { Router, Request, Response, NextFunction } from "express";
import {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController";

declare global {
  namespace Express {
    interface User {
      _id: string;
    }
    interface Request {
      user?: User;
    }
  }
}

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  req.user = { _id: "6641f8d1c123456789abcdef" }; // Mock user ID
  next();
});

router.post("/", createAddress);
router.get("/", getUserAddresses);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
