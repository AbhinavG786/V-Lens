import lens from "../controllers/lensController";
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";
import adminWarehouseAuth from "../middlewares/adminWarehouseAuth";
import upload from "../middlewares/upload";

const router = Router();

router.route("/").post(adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.single('file'),lens.createLens);
router.route("/all").get(paginationMiddleware(10, 50), lens.getAllLens);
router.route("/brand").get(paginationMiddleware(10, 50),lens.getLensByBrand);
router.route("/type").get(paginationMiddleware(10, 50),lens.getLensByType);
router.route("/priceRange").get(paginationMiddleware(10, 50), lens.getLensByPriceRange);
router.route("/color").get(paginationMiddleware(10, 50), lens.getLensByColor);
router.route("/gender").get(paginationMiddleware(10, 50), lens.getLensByGender);
router.route("/power").get(paginationMiddleware(10, 50), lens.getLensByPower);
router.route("/filters").get(paginationMiddleware(10, 50), lens.getLensByFilters);
router.route("/:lensId").get(lens.getLensById);
router.route("/:lensId").patch(adminWarehouseAuth.verifyAdminAndWarehouseSession,upload.single('file'),lens.updateLensProduct);
router.route("/:lensId").delete(adminWarehouseAuth.verifyAdminAndWarehouseSession,lens.deleteLens);

export default router;