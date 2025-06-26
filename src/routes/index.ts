import { Router } from "express"
import userRoutes from "./userRoutes"
import productRoutes from "./productRoutes"
import recommendationRoutes from "./recommendationRoutes"
import prescriptionRoutes from "./prescriptionRoutes"
import authRoutes from "./authRoutes"

const router = Router();

router.use("/user", userRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/product", productRoutes);
router.use("/prescription", prescriptionRoutes);
router.use("/auth", authRoutes);

export default router;
