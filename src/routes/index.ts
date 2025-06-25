import userRoutes from "./userRoutes"
import { Router } from "express"

const router = Router();

router.use("/user", userRoutes);

export default router;
