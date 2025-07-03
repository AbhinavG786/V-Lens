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
import addressRoutes from "./addressRoutes";
import roomRoutes from "./roomRoutes";
import wishlistRoutes from "./wishlistRoutes";
import searchRoutes from "./searchRoutes";
import reviewRoutes from "./reviewRoutes";
import orderRoutes from "./orderRoutes";
import cartRoutes from "./cartRoutes";
import lensRoutes from "./lensRoutes";
import secureAdminRoutes from "./secureAdminRoutes";

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
router.use("/address", addressRoutes);
router.use("/room", roomRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/search",searchRoutes);
router.use("/reviews", reviewRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/lens", lensRoutes);
router.use("/secure-admin", secureAdminRoutes);

export default router;
