import { Router } from "express";
import warehouse from "../controllers/warehouseController";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";
import warehouseAuth from "../middlewares/warehouseAuth";

const router = Router();

router.route("/").post(adminAuth.verifyAdminSession,warehouse.createWarehouse)
router.route("/create-manager").post(adminAuth.verifyAdminSession,warehouse.createWarehouseManager)
router.route("/assign-manager").post(adminAuth.verifyAdminSession,warehouse.assignWarehouseManager)
router.route("/transfer").post(warehouse.transferStockAcrossWarehouses)
router.route("/all").get(adminAuth.verifyAdminSession,paginationMiddleware(10,50),warehouse.getAllWarehouses)
router.route("/:id").get(adminAuth.verifyAdminSession,warehouse.getWarehouseById)
router.route("/:id").patch(adminAuth.verifyAdminSession,warehouse.updateWarehouseById)
router.route("/:id").delete(adminAuth.verifyAdminSession,warehouse.deleteWarehouseById)

export default router;