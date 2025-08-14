import crypto from "crypto";
import { Request, Response } from "express";
import { PaymentStatus, Payment } from "../models/paymentModel";
import mongoose from "mongoose";
import { Order } from "../models/orderModel";

class PaymentController {
  // createPayment = async (req: Request, res: Response) => {
  //   try {
  //     const { userId, orderId, amount, method, transactionId, status } =
  //       req.body;
  //     if (
  //       !userId ||
  //       !orderId ||
  //       !amount ||
  //       !method ||
  //       !transactionId ||
  //       !status
  //     ) {
  //       res.status(400).json({ message: "All fields are required." });
  //       return;
  //     }
  //     if (!Object.values(PaymentStatus).includes(status)) {
  //       res.status(400).json({ message: "Invalid payment status." });
  //       return;
  //     }
  //     const payment = new Payment({
  //       userId,
  //       orderId,
  //       amount,
  //       method,
  //       transactionId,
  //       status,
  //     });
  //     const savedPayment = await payment.save();
  //     res.status(201).json(savedPayment);
  //   } catch (error) {
  //     res.status(500).json({ message: "Failed to create payment", error });
  //   }
  // };

  getAllPayments = async (req: Request, res: Response) => {
    try {
      const { skip, take } = req.pagination!;
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
      res.status(500).json({ message: "Failed to fetch payments", error });
    }
  };

  getPaymentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid payment ID." });
        return;
      }
      const payment = await Payment.findById(id);
      if (!payment) {
        res.status(404).json({ message: "Payment not found." });
        return;
      }
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment", error });
    }
  };

  /**
   * POST /api/payment/create-order
   * Body: { amount: number }  // rupees
   */
  // createPaymentOrder = async (req: Request, res: Response) => {
  //   const { amount } = req.body; // ₹
  //   const options = {
  //     amount: Math.round(amount * 100), // paise
  //     currency: "INR",
  //     receipt: `rcpt_${Date.now()}`,
  //   };

  //   try {
  //     const order = await razorpay.orders.create(options);
  //     res.status(201).json(order);
  //   } catch (err) {
  //     console.error("Razorpay order error:", err);
  //     res.status(500).json({ error: "Order creation failed" });
  //   }
  // };

  /**
   * POST /api/payment/verify
   * Body: {
   *   razorpay_order_id: string;
   *   razorpay_payment_id: string;
   *   razorpay_signature: string;
   * }
   */
  // verifyPayment = (req: Request, res: Response) => {
  //   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
  //     req.body;

  //   const hmac = crypto
  //     .createHmac("sha256", process.env.RAZORPAY_SECRET!)
  //     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  //     .digest("hex");

  //   if (hmac === razorpay_signature) {
  //     // TODO: save payment details in DB here
  //     res.json({ verified: true, message: "Payment verified" });
  //     return;
  //   }

  //   res.status(400).json({ verified: false, error: "Invalid signature" });
  // };

  verifyAndSavePayment = async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      // Step 1: Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ message: "All fields are required." });
        return;
      }

      // Step 2: Verify Razorpay signature
      const hmac = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isValid = hmac === razorpay_signature;

      const existingPayment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
        status: PaymentStatus.SUCCESS,
      });
      if (existingPayment) {
        res.status(409).json({ message: "Payment already verified" });
        return;
      }

      const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }

      payment.paidAt = new Date();
      payment.transactionId = razorpay_payment_id;
      payment.status = isValid ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

      const savedPayment = await payment.save();

      const allSuccessfulPayments = await Payment.find({
        orderId: savedPayment.orderId,
        status: PaymentStatus.SUCCESS,
      });

      const totalPaid = allSuccessfulPayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.amountPaid = totalPaid;
        order.paymentStatus =
          totalPaid >= order.totalAmount
            ? "completed"
            : totalPaid > 0
            ? "pending"
            : "failed";
        order.paidAt = totalPaid >= order.totalAmount ? new Date() : null;
 await order.save();
      }
      // await Order.findByIdAndUpdate(savedPayment.orderId, {
      //   paymentStatus: isValid ? "completed" : "failed",
      //   amountPaid: totalPaid,
      //   paidAt: new Date(),
      // });

      // const order = await Order.findById(payment.orderId);
      // if (!order) {
      //   res.status(404).json({ message: "Order not found." });
      //   return;
      // }

      // Step 3: Save Payment in DB
      // const payment = new Payment({
      //   userId,
      //   orderId,
      //   amount: order.totalAmount,
      //   method: order.paymentMethod,
      //   transactionId: razorpay_payment_id,
      //   status: isValid ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      // });

      // await payment.save();

      // Step 4: Update Order Payment Status
      // await order.updateOne({
      //   paymentStatus: isValid ? "completed" : "failed",
      // });
      // await Order.findByIdAndUpdate(orderId, {
      //   paymentStatus: isValid ? "completed" : "failed",
      // });

      if (isValid) {
        res.status(200).json({
          verified: true,
          payment,
          order,
          message: "Payment verified and saved successfully.",
        });
        return;
      } else {
        res.status(400).json({
          verified: false,
          payment,
          order,
          error: "Invalid signature. Payment failed.",
        });
        return;
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Internal server error", error });
      return;
    }
  };
}

export default new PaymentController();
