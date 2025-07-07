import accessories from "../controllers/accessoriesController"
import paginationMiddleware from "../middlewares/paginationMiddleware";
import upload from "../middlewares/upload";
import { Router } from "express"
const router = Router()


router.route("/").post(upload.single('file'),accessories.createAccessories);
router.route("/all").get(paginationMiddleware(10, 50), accessories.getAllAccessories);
router.route("/brand").get(paginationMiddleware(10, 50),accessories.getAccessoriesByBrand);
router.route("/priceRange").get(paginationMiddleware(10, 50), accessories.getAccessoriesByPriceRange);
router.route("/:lensId").get(accessories.getAccessoriesById);
router.route("/:lensId").patch(upload.single('file'),accessories.updateAccessoriesProduct);
router.route("/:lensId").delete(accessories.deleteAccessories);

export default router;