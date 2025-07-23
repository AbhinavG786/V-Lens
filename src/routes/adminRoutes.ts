import admin from "../controllers/adminController";
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from "../middlewares/adminAuth";
import agentAuth from "../middlewares/agentAuth";
import agent from "../controllers/agentController"

const router = Router();

router.route("/all").get(adminAuth.verifyAdminSession, paginationMiddleware(10, 50), admin.getAllUsers);
router.route("/agent/toggle").patch(agentAuth.verifyAgentSession, agent.toggleAvailability);
router.route("/agent/stats/:agentId").get(adminAuth.verifyAdminSession, agent.getAgentRatingStats);
router.route("/agent/all").get(adminAuth.verifyAdminSession,paginationMiddleware(10,50), agent.getAllAgents);
router.route("/agent/available").get(adminAuth.verifyAdminSession, paginationMiddleware(10,50), agent.getAllAvailableAgents);
router.route("/:userId").get(adminAuth.verifyAdminSession, admin.getUserById);
router.route("/agent/update/:agentId").patch(adminAuth.verifyAdminSession, agent.updateAgentProperties);
router.route("/:userId").patch(adminAuth.verifyAdminSession, admin.updateUser);
router.route("/:userId").delete(adminAuth.verifyAdminSession, admin.deleteUser);

export default router; 