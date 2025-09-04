import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import paginationMiddleware from '../middlewares/paginationMiddleware';
import AdminAuthMiddleware from '../middlewares/adminAuth';
import firebaseAuthMiddleware from '../middlewares/firebaseAuth';

const router = Router();

router.get('/', paginationMiddleware(10, 50), paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.post("/verify", paymentController.verifyAndSavePayment);
router.post("/request-refund",firebaseAuthMiddleware.verifySessionCookie, paymentController.requestRefund);
router.post("/initiate-refund/:requestId", AdminAuthMiddleware.verifyAdminSession, paymentController.initiateRefund);
router.post("/refund-webhook", paymentController.handleRazorpayWebhook);
router.post("/reject-refund/:requestId", AdminAuthMiddleware.verifyAdminSession, paymentController.rejectRefund);

// New route for COD inventory deduction
// router.post("/cod/:orderId/deduct-inventory", AdminAuthMiddleware.verifyAdminSession, paymentController.deductInventoryForCOD);

// POST /payments
// router.post('/', paymentController.createPayment);
// GET /payments (paginated)

// GET /payments/:id
// router.post('/create-order', paymentController.createPaymentOrder);
// router.post('/verify', paymentController.verifyPayment);

export default router;