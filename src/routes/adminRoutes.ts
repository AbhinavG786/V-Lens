import admin from "../controllers/adminController";
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";
import agent from "../controllers/agentController"

const router = Router();

router.route("/all").get(adminAuth.verifyAdminSession, paginationMiddleware(10, 50), admin.getAllUsers);
router.route("/:userId").get(adminAuth.verifyAdminSession, admin.getUserById);
router.route("/agent/toggle").patch(adminAuth.verifyAdminSession, agent.toggleAvailability);
router.route("/agent/stats/:agentId").get(agent.getAgentRatingStats);
router.route("/:userId").patch(adminAuth.verifyAdminSession, admin.updateUser);
router.route("/:userId").delete(adminAuth.verifyAdminSession, admin.deleteUser);

export default router; 