import express from "express";
import SunglassController from "../controllers/sunglassController";
import upload from "../middlewares/upload";

const router = express.Router();

router.post("/", upload.single("image"), SunglassController.createSunglass);
router.get("/", SunglassController.getAllSunglasses);
router.get("/:id", SunglassController.getSunglassById);
router.put("/:id", upload.single("image"), SunglassController.updateSunglass);
router.delete("/:id", SunglassController.deleteSunglass);

export default router; 