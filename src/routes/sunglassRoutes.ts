import { Router } from "express";
import Sunglass from "../controllers/sunglassController";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import upload from "../middlewares/upload";
import adminAuth from "../middlewares/adminAuth";
import adminWarehouseAuth from "../middlewares/adminWarehouseAuth";

const router = Router();

router.route("/").post(adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.single('file'),Sunglass.createSunglass);
router.route("/all").get(paginationMiddleware(10, 50), Sunglass.getAllSunglasses);
router.route("/filters").get(paginationMiddleware(10, 50), Sunglass.getSunglassesByFilters);
router.route("/brand").get(paginationMiddleware(10, 50),Sunglass.getSunglassesByBrand);
router.route("/type").get(paginationMiddleware(10, 50),Sunglass.getSunglassesByFrameType);
router.route("/priceRange").get(paginationMiddleware(10, 50), Sunglass.getSunglassesByPriceRange);
router.route("/lensShape").get(paginationMiddleware(10,50),Sunglass.getSunglassesByLensShape)
router.route("/size").get(paginationMiddleware(10,50),Sunglass.getSunglassesBySize);
router.route("/:sunglassId").get(Sunglass.getSunglassById);
router.route("/:sunglassId").patch(adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.single('file'),Sunglass.updateSunglassProduct);
router.route("/:sunglassId").delete(adminWarehouseAuth.verifyAdminAndWarehouseSession,Sunglass.deleteSunglass);


export default router;