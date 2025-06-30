import lens from "../controllers/lensController";
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router = Router();

router.route("/").post(lens.createLens);
router.route("/all").get(paginationMiddleware(10, 50), lens.getAllLens);
router.route("/brand").get(paginationMiddleware(10, 50),lens.getLensByBrand);
router.route("/type").get(paginationMiddleware(10, 50),lens.getLensByType);
router.route("/priceRange").get(paginationMiddleware(10, 50), lens.getLensByPriceRange);
router.route("/:lensId").get(lens.getLensById);
router.route("/:lensId").patch(lens.updateLens);
router.route("/:lensId").delete(lens.deleteLens);

export default router;