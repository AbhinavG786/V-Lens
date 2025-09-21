import { Router } from "express";
import frameController from "../controllers/frameController";
import upload from "../middlewares/upload";
import adminAuth from "../middlewares/adminAuth"
import adminWarehouseAuth from "../middlewares/adminWarehouseAuth";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router = Router();

router.post("/",adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.single("file"), frameController.createFrame);
router.get("/all",paginationMiddleware(10,50), frameController.getAllFrames);
router.get("/filters",paginationMiddleware(10,50), frameController.getFramesByFilters);
router.get("/:id", frameController.getFrameById);
router.patch("/:id",adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.single("image"), frameController.updateFrame);
router.delete("/:id",adminWarehouseAuth.verifyAdminAndWarehouseSession, frameController.deleteFrame);

export default router;