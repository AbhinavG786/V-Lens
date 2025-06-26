import UserAuth from "../controllers/firebaseAuthController";
import { Router } from "express";

const router = Router();
router.route("/login").post(UserAuth.login);
router.route("/logout").post(UserAuth.logout);

export default router;