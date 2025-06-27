import { Router } from 'express';
import paymentController from '../controllers/paymentController';

const router = Router();

// POST /payments
router.post('/', paymentController.createPayment);

// GET /payments
router.get('/', paymentController.getAllPayments);

// GET /payments/:id
router.get('/:id', paymentController.getPaymentById);

export default router; 