import lens from "../controllers/lensController";
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";
import upload from "../middlewares/upload";

const router = Router();

router.route("/").post(adminAuth.verifyAdminSession,upload.single('file'),lens.createLens);
router.route("/all").get(paginationMiddleware(10, 50), lens.getAllLens);
router.route("/brand").get(paginationMiddleware(10, 50),lens.getLensByBrand);
router.route("/type").get(paginationMiddleware(10, 50),lens.getLensByType);
router.route("/priceRange").get(paginationMiddleware(10, 50), lens.getLensByPriceRange);
router.route("/:lensId").get(lens.getLensById);
router.route("/:lensId").patch(adminAuth.verifyAdminSession,upload.single('file'),lens.updateLensProduct);
router.route("/:lensId").delete(adminAuth.verifyAdminSession,lens.deleteLens);

export default router;