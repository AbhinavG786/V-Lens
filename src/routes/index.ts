import userRoutes from "./userRoutes"
import productRoutes from "./productRoutes"
import { Router } from "express"

const router = Router();

router.use("/user", userRoutes);
router.use("/product", productRoutes);

export default router;
