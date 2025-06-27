import { Router } from 'express';
import { createPayment, getAllPayments, getPaymentById } from '../controllers/paymentController';

const router = Router();

// POST /api/payments
router.post('/', createPayment);

// GET /api/payments
router.get('/', getAllPayments);

// GET /api/payments/:id
router.get('/:id', getPaymentById);

export default router; 