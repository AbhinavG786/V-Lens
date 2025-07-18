import { Router } from "express";
import cartController from "../controllers/cartController";
import FirebaseAuthMiddleware from "../middlewares/firebaseAuth";

const router = Router();
router.use(FirebaseAuthMiddleware.verifySessionCookie);

router.get("/", cartController.getCart);

router.post("/add", cartController.addToCart);

router.put("/update", cartController.updateItemQuantity);

router.delete("/item", cartController.removeFromCart);

router.delete("/", cartController.clearCart);

export default router;
