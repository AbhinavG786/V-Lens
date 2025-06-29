import orderController from "../controllers/orderController";
import { Router } from "express";
import FirebaseAuthMiddleware from "../middlewares/firebaseAuth";

const router = Router();

// User routes - require authentication
router.route("/").post(FirebaseAuthMiddleware.verifySessionCookie, orderController.createOrder);
router.route("/").get(FirebaseAuthMiddleware.verifySessionCookie, orderController.getOrdersByUser);
router.route("/:id").get(FirebaseAuthMiddleware.verifySessionCookie, orderController.getOrderById);
router.route("/:id/cancel").patch(FirebaseAuthMiddleware.verifySessionCookie, orderController.cancelOrder);

// Admin routes - require authentication (you may want to add admin role check later)
router.route("/admin/all").get(FirebaseAuthMiddleware.verifySessionCookie, orderController.getAllOrders);
router.route("/:id/status").patch(FirebaseAuthMiddleware.verifySessionCookie, orderController.updateOrderStatus);
router.route("/:id/payment").patch(FirebaseAuthMiddleware.verifySessionCookie, orderController.updatePaymentStatus);
router.route("/:id/tracking").patch(FirebaseAuthMiddleware.verifySessionCookie, orderController.addTrackingInfo);

export default router; 