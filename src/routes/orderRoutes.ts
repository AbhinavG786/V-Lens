import orderController from "../controllers/orderController";
import { Router } from "express";
import FirebaseAuthMiddleware from "../middlewares/firebaseAuth";
import AdminAuthMiddleware from "../middlewares/adminAuth";
import paginationMiddleware from "../middlewares/paginationMiddleware";

const router = Router();

// User routes - require authentication
router.route("/").post(FirebaseAuthMiddleware.verifySessionCookie, orderController.createOrder);
router.route("/").get(FirebaseAuthMiddleware.verifySessionCookie, orderController.getOrdersByUser);
router.route("/:id").get(FirebaseAuthMiddleware.verifySessionCookie, orderController.getOrderById);
router.route("/:id/cancel").patch(FirebaseAuthMiddleware.verifySessionCookie, orderController.cancelOrder);
router.route("/track/:orderNumber").get(FirebaseAuthMiddleware.verifySessionCookie, orderController.trackOrder);

// Admin routes - require admin authentication
router.route("/admin/all").get(AdminAuthMiddleware.verifyAdminSession,paginationMiddleware(10,50), orderController.getAllOrders);
router.route("/:id/status").patch(AdminAuthMiddleware.verifyAdminSession, orderController.updateOrderStatus);
router.route("/:id/payment").patch(AdminAuthMiddleware.verifyAdminSession, orderController.updatePaymentStatus);
router.route("/:id/tracking").patch(AdminAuthMiddleware.verifyAdminSession, orderController.addTrackingInfo);

export default router; 