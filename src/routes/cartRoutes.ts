import express from "express";
import {
  addToCart,
  getCart,
  updateItemQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cartController";

const router = express.Router();

router.post("/add", addToCart);
router.get("/:userId", getCart);
router.put("/update", updateItemQuantity);
router.delete("/remove", removeFromCart);
router.delete("/clear/:userId", clearCart);

export default router;
