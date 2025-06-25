import user from "../controllers/userController"
import { Router } from "express";

const router= Router();

router.route("/all").get(user.getAllUsers)

export default router;