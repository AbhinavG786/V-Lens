import { Router } from "express";
import Sunglass from "../controllers/sunglassController";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import upload from "../middlewares/upload";
import adminAuth from "../middlewares/adminAuth";

const router = Router();

router.route("/").post(adminAuth.verifyAdminSession,upload.single('file'),Sunglass.createSunglass);
router.route("/all").get(paginationMiddleware(10, 50), Sunglass.getAllSunglasses);
router.route("/brand").get(paginationMiddleware(10, 50),Sunglass.getSunglassesByBrand);
router.route("/type").get(paginationMiddleware(10, 50),Sunglass.getSunglassesByFrameType);
router.route("/priceRange").get(paginationMiddleware(10, 50), Sunglass.getSunglassesByPriceRange);
router.route("/lensShape").get(paginationMiddleware(10,50),Sunglass.getSunglassesByLensShape)
router.route("/size").get(paginationMiddleware(10,50),Sunglass.getSunglassesBySize);
router.route("/:sunglassId").get(Sunglass.getSunglassById);
router.route("/:sunglassId").patch(adminAuth.verifyAdminSession,upload.single('file'),Sunglass.updateSunglassProduct);
router.route("/:sunglassId").delete(adminAuth.verifyAdminSession,Sunglass.deleteSunglass);



export default router;