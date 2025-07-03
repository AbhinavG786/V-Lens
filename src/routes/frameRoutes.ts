import { Router } from "express";
import frameController from "../controllers/frameController";

const router = Router();

router.post("/create", frameController.createFrame);
router.get("/all", frameController.getAllFrames);
router.get("/:id", frameController.getFrameById);
router.put("/:id", frameController.updateFrame);
router.delete("/:id", frameController.deleteFrame);

export default router;