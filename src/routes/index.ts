import { Router } from "express"
import userRoutes from "./userRoutes"
import productRoutes from "./productRoutes"
import recommendationRoutes from "./recommendationRoutes"
import prescriptionRoutes from "./prescriptionRoutes"
import authRoutes from "./authRoutes"
import paymentRoutes from "./paymentRoutes"
import notificationRoutes from "./notificationRoutes";
import adminRoutes from "./adminRoutes";
import inventoryRoutes from "./inventoryRoutes";


const router = Router();

router.use("/user", userRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/product", productRoutes);
router.use("/prescription", prescriptionRoutes);
router.use("/auth", authRoutes);
router.use("/payments", paymentRoutes);
router.use("/notification",notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/admin", inventoryRoutes);

export default router;
