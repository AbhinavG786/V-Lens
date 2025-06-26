import userRoutes from "./userRoutes"
import productRoutes from "./productRoutes"
import { Router } from "express"
import recommendationRoutes from "./recommendationRoutes"
import prescriptionRoutes from "./prescription.route"
const router = Router();

router.use("/user", userRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/product", productRoutes);
router.use("/prescription", prescriptionRoutes);

export default router;
