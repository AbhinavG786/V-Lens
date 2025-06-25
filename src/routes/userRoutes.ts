import user from "../controllers/userController"
import { Router } from "express";

const router= Router();

router.route("/all").get(user.getAllUsers)
router.route("/:userId").get(user.getUserById)
router.route("/:userId").patch(user.updateUser)
router.route("/:userId").delete(user.deleteUser)


export default router;