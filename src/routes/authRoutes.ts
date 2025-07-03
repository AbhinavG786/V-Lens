import UserAuth from "../controllers/firebaseAuthController";
import { Router } from "express";

const router = Router();
router.route("/login").post(UserAuth.login);
router.route("/logout").post(UserAuth.logout);
router.route("/req-reset").post(UserAuth.requestPasswordReset);
router.route("/verify-reset/:userId/:token").post(UserAuth.verifyPasswordResetToken);
router.route("/reset/:userId").post(UserAuth.resetPassword);

export default router;