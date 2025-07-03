import { Request, Response } from 'express';
import { PaymentStatus ,Payment} from '../models/paymentModel';
import mongoose from 'mongoose';

class PaymentController {
  createPayment = async (req: Request, res: Response) => {
    try {
      const { userId, orderId, amount, method, transactionId, status } = req.body;
      if (!userId || !orderId || !amount || !method || !transactionId || !status) {
        res.status(400).json({ message: 'All fields are required.' });
        return;
      }
      if (!Object.values(PaymentStatus).includes(status)) {
        res.status(400).json({ message: 'Invalid payment status.' });
        return;
      }
      const payment = new Payment({
        userId,
        orderId,
        amount,
        method,
        transactionId,
        status,
      });
      const savedPayment = await payment.save();
      res.status(201).json(savedPayment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create payment', error });
    }
  };

  getAllPayments = async (req: Request, res: Response) => {
    try {
      const { skip = 0, take = 10 } = (req as any).pagination || {};
      const payments = await Payment.find()
        .sort({ paidAt: -1 })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Payment.countDocuments();
      res.status(200).json({
        data: payments,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch payments', error });
    }
  };

  getPaymentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid payment ID.' });
        return;
      }
      const payment = await Payment.findById(id);
      if (!payment) {
        res.status(404).json({ message: 'Payment not found.' });
        return;
      }
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch payment', error });
    }
  };
}

export default new PaymentController(); 