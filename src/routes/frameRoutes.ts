import { Router } from "express";
import frameController from "../controllers/frameController";
import upload from "../middlewares/upload";

const router = Router();

router.post("/create",upload.single("file"), frameController.createFrame);
router.get("/all", frameController.getAllFrames);
router.get("/:id", frameController.getFrameById);
router.put("/:id",upload.single("image"), frameController.updateFrame);
router.delete("/:id", frameController.deleteFrame);

export default router;