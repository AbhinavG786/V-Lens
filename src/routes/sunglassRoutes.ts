import { Router } from "express";
import SunglassController from "../controllers/sunglassController";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import upload from "../middlewares/upload";
import AdminAuthMiddleware from "../middlewares/adminAuth";

const router = Router();

router.post("/", AdminAuthMiddleware.verifyAdminSession, upload.single("image"), SunglassController.createSunglass);
router.get("/", AdminAuthMiddleware.verifyAdminSession, paginationMiddleware(), SunglassController.getAllSunglasses);
router.get("/:id", AdminAuthMiddleware.verifyAdminSession, SunglassController.getSunglassById);
router.put("/:id", AdminAuthMiddleware.verifyAdminSession, upload.single("image"), SunglassController.updateSunglass);
router.delete("/:id", AdminAuthMiddleware.verifyAdminSession, SunglassController.deleteSunglass);

export default router; 