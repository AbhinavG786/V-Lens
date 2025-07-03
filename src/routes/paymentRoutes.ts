import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import paginationMiddleware from '../middlewares/paginationMiddleware';

const router = Router();

// POST /payments
router.post('/', paymentController.createPayment);

// GET /payments (paginated)
router.get('/', paginationMiddleware(10, 50), paymentController.getAllPayments);

// GET /payments/:id
router.get('/:id', paymentController.getPaymentById);

export default router; 