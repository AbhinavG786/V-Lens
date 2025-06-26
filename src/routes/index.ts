import userRoutes from "./userRoutes"
import { Router } from "express"
import recommendationRoutes from "./recommendationRoutes"

const router = Router();

router.use("/user", userRoutes);
router.use("/recommendations", recommendationRoutes);

export default router;
