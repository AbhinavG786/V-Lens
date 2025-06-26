import userRoutes from "./userRoutes"
import productRoutes from "./productRoutes"
import { Router } from "express"
import recommendationRoutes from "./recommendationRoutes"

const router = Router();

router.use("/user", userRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/product", productRoutes);

export default router;
