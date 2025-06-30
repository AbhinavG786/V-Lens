import admin from "../controllers/adminController"
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router= Router();

router.route("/all").get(paginationMiddleware(10,50),admin.getAllUsers)
router.route("/:userId").get(admin.getUserById)
router.route("/:userId").patch(admin.updateUser)
router.route("/:userId").delete(admin.deleteUser)


export default router;