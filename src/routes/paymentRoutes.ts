import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import paginationMiddleware from '../middlewares/paginationMiddleware';

const router = Router();

router.get('/', paginationMiddleware(10, 50), paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.post("/verify", paymentController.verifyAndSavePayment);
router.post("/initiate-refund", paymentController.initiateRefund);
router.post("/refund-webhook", paymentController.handleRazorpayWebhook);

// POST /payments
// router.post('/', paymentController.createPayment);
// GET /payments (paginated)

// GET /payments/:id
// router.post('/create-order', paymentController.createPaymentOrder);
// router.post('/verify', paymentController.verifyPayment);

export default router;