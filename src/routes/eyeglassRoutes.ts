import eyeglass from "../controllers/eyeglassController";
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";
import upload from "../middlewares/upload";

const router = Router();


router.route("/").post(adminAuth.verifyAdminSession, upload.single('file'), eyeglass.createEyeglass);
router.route("/all").get(paginationMiddleware(10, 50), eyeglass.getAllEyeglasses);
router.route("/brand").get(paginationMiddleware(10, 50), eyeglass.getEyeglassByBrand);
router.route("/frameType").get(paginationMiddleware(10, 50), eyeglass.getEyeglassByFrameType);
router.route("/frameShape").get(paginationMiddleware(10, 50), eyeglass.getEyeglassByFrameShape);
router.route("/gender").get(paginationMiddleware(10, 50), eyeglass.getEyeglassByGender);
router.route("/priceRange").get(paginationMiddleware(10, 50), eyeglass.getEyeglassByPriceRange);
router.route("/:eyeglassId").get(eyeglass.getEyeglassById);
router.route("/:eyeglassId").patch(adminAuth.verifyAdminSession, upload.single('file'), eyeglass.updateEyeglassProduct);
router.route("/:eyeglassId").delete(adminAuth.verifyAdminSession, eyeglass.deleteEyeglass);

export default router;