import { Router } from "express";
import warehouse from "../controllers/warehouseController";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";

const router = Router();

router.route("/").post(adminAuth.verifyAdminSession,warehouse.createWarehouse)
router.route("/all").get(adminAuth.verifyAdminSession,paginationMiddleware(10,50),warehouse.getAllWarehouses)
router.route("/:id").get(adminAuth.verifyAdminSession,warehouse.getWarehouseById)
router.route("/:id").patch(adminAuth.verifyAdminSession,warehouse.updateWarehouseById)
router.route("/:id").delete(adminAuth.verifyAdminSession,warehouse.deleteWarehouseById)

export default router;