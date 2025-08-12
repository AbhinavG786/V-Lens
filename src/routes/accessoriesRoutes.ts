import accessories from "../controllers/accessoriesController"
import paginationMiddleware from "../middlewares/paginationMiddleware";
import upload from "../middlewares/upload";
import adminAuth from "../middlewares/adminAuth";
import { Router } from "express"
const router = Router()


router.route("/").post(adminAuth.verifyAdminSession,upload.single('file'),accessories.createAccessories);
router.route("/all").get(paginationMiddleware(10, 50), accessories.getAllAccessories);
router.route("/filters").get(paginationMiddleware(10, 50), accessories.getAccessoriesByFilters);
router.route("/brand").get(paginationMiddleware(10, 50),accessories.getAccessoriesByBrand);
router.route("/priceRange").get(paginationMiddleware(10, 50), accessories.getAccessoriesByPriceRange);
router.route("/:accessoriesId").get(accessories.getAccessoriesById);
router.route("/:accessoriesId").patch(adminAuth.verifyAdminSession,upload.single('file'),accessories.updateAccessoriesProduct);
router.route("/:accessoriesId").delete(adminAuth.verifyAdminSession,accessories.deleteAccessories);

export default router;