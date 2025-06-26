import admin from "../controllers/adminController"
import { Router } from "express";

const router= Router();

router.route("/all").get(admin.getAllUsers)
router.route("/:userId").get(admin.getUserById)
router.route("/:userId").patch(admin.updateUser)
router.route("/:userId").delete(admin.deleteUser)


export default router;