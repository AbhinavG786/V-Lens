import user from "../controllers/userController"
import { Router } from "express";
import FirebaseAuthMiddleware from "../middlewares/firebaseAuth";

const router= Router();

router.route("/").get(FirebaseAuthMiddleware.verifySessionCookie,user.getUserProfile)
router.route("/").patch(FirebaseAuthMiddleware.verifySessionCookie,user.updateUser)
router.route("/").delete(FirebaseAuthMiddleware.verifySessionCookie,user.deleteUser)


export default router;