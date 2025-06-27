import userRoutes from "./userRoutes"
import productRoutes from "./productRoutes"
import notificationRoutes from "./notificationRoutes";
import { Router } from "express"

const router = Router();

router.use("/user", userRoutes);
router.use("/product", productRoutes);
router.use("/notification",notificationRoutes);

export default router;
