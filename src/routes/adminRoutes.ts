import admin from "../controllers/adminController"
import { Router } from "express";
import AdminAuthMiddleware from "../middlewares/adminAuth";

const router = Router();

// All admin routes require admin authentication
router.use(AdminAuthMiddleware.verifyAdminSession);

// Dashboard and analytics
router.route("/dashboard").get(admin.getDashboardStats);
router.route("/analytics/orders").get(admin.getOrderAnalytics);

// User management
router.route("/users").get(admin.getAllUsers);
router.route("/users/:userId/admin-status").patch(admin.updateUserAdminStatus);
router.route("/users/:userId").delete(admin.deleteUser);

export default router;