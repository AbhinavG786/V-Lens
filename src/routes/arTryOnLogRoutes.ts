import { Router } from "express";
import ARTryOnLogController from "../controllers/arTryOnLogController";

const router = Router();

router.post("/tryon-logs", ARTryOnLogController.logTryOn);

export default router; 