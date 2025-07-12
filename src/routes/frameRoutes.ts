import { Router } from "express";
import frameController from "../controllers/frameController";
import upload from "../middlewares/upload";
import adminAuth from "../middlewares/adminAuth"

const router = Router();

router.post("/create",adminAuth.verifyAdminSession,upload.single("file"), frameController.createFrame);
router.get("/all", frameController.getAllFrames);
router.get("/:id", frameController.getFrameById);
router.patch("/:id",adminAuth.verifyAdminSession,upload.single("image"), frameController.updateFrame);
router.delete("/:id",adminAuth.verifyAdminSession, frameController.deleteFrame);

export default router;