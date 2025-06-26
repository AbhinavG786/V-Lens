import { Router } from "express"
import userRoutes from "./userRoutes"
import productRoutes from "./productRoutes"
import recommendationRoutes from "./recommendationRoutes"
<<<<<<< HEAD
import prescriptionRoutes from "./prescription.route"
=======
import authRoutes from "./authRoutes"

>>>>>>> 27f1669825f53749f29f05bcb7687a154bf8077e
const router = Router();

router.use("/user", userRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/product", productRoutes);
<<<<<<< HEAD
router.use("/prescription", prescriptionRoutes);
=======
router.use("/auth", authRoutes);
>>>>>>> 27f1669825f53749f29f05bcb7687a154bf8077e

export default router;
