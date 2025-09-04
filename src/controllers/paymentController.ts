import crypto from "crypto";
import { Request, Response } from "express";
import { PaymentStatus, Payment } from "../models/paymentModel";
import mongoose from "mongoose";
import { Order } from "../models/orderModel";
import { Inventory } from "../models/inventoryModel";
import { Product } from "../models/productModel";
import { User } from "../models/userModel";
import { RefundRequest } from "../models/refundRequestModel";
import { razorpay } from "../utils/razorpay";

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

        // If payment is fully completed, deduct inventory
        if (totalPaid >= order.totalAmount && isValid) {
          const allAssigned = order.items.every((it: any) => it.warehouseId);
          if (!allAssigned) {
            res.status(400).json({
              verified: true,
              payment,
              order,
              message:
                "Payment verified, but warehouses must be assigned for all items before inventory deduction.",
            });
            return;
          }
          try {
            await this.deductInventoryFromOrder(order);
            await order.save();
          } catch (err) {
            res.status(500).json({
              message: "Payment verified but inventory deduction failed",
              error: err,
            });
            return;
          }
        }

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

  initiateRefund = async (req: Request, res: Response) => {
    // const { paymentId, amount } = req.body; // amount in paise
    const { requestId } = req.params;
    const refundReq = await RefundRequest.findById(requestId).populate(
      "paymentId"
    );

    if (!refundReq || refundReq.status !== "pending") {
      res.status(400).json({ message: "Invalid or already processed request" });
      return;
    }

    const paymentId = refundReq.paymentId;
    const amount = refundReq.amount; // in paise

    if (!paymentId) {
      res.status(400).json({ message: "paymentId is required" });
      return;
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== PaymentStatus.SUCCESS) {
      res.status(400).json({ message: "Payment not eligible for refund" });
      return;
    }

    try {
      // Call Razorpay Refund API
      if (typeof payment.transactionId === "string") {
        const refund = await razorpay.payments.refund(payment.transactionId, {
          amount: amount || payment.amount, // if not partial, refund full
        });

        if (!refund) {
          res.status(500).json({
            message: "Refund failed",
            error: "Razorpay refund API error",
          });
          return;
        }
        // Update Payment document
        // Push new refund entry instead of overwriting
        payment.refundHistory.push({
          refundId: refund.id,
          refundAmount: refund.amount ? refund.amount / 100 : 0,
          refundInitiatedAt: new Date(),
        });

        // Update payment status
        const totalRefundedSoFar = payment.refundHistory.reduce(
          (sum, r) => sum + r.refundAmount,
          0
        );
        payment.status =
          totalRefundedSoFar === payment.amount
            ? PaymentStatus.REFUND_INITIATED
            : PaymentStatus.PARTIAL_REFUND;

        await payment.save();

        refundReq.status = "initiated";
        await refundReq.save();

        // payment.refundId = refund.id;
        // payment.refundedAmount = refund.amount ? refund.amount / 100 : 0;
        // payment.status =
        //   refund.amount === payment.amount
        //     ? PaymentStatus.REFUND_INITIATED
        //     : PaymentStatus.PARTIAL_REFUND;
        // payment.refundInitiatedAt = new Date();
        // await payment.save();

        res.json({ message: "Refund initiated", refund });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Refund failed", error: err.message });
    }
  };

  // handleRazorpayWebhook = async (req: Request, res: Response) => {
  //   const { event, payload } = req.body;

  //   if (event === "refund.processed") {
  //     const refund = payload.refund.entity;
  //     const payment = await Payment.findOne({ refundId: refund.id });

  //     if (payment) {
  //       if (payment.refundProcessedAt) {
  //         res.status(200).json({ received: true }); // already processed
  //         return;
  //       }

  //       const totalRefunded = refund.amount / 100; // convert to rupees
  //       if(totalRefunded > payment.amount) {
  //         res.status(400).json({ message: "Refund amount exceeds payment amount" });
  //         return;
  //       }
  //       payment.status =
  //         totalRefunded === payment.amount
  //           ? PaymentStatus.REFUNDED
  //           : PaymentStatus.PARTIAL_REFUND;
  //       // payment.status =
  //       //   refund.amount === payment.amount
  //       //     ? PaymentStatus.REFUNDED
  //       //     : PaymentStatus.PARTIAL_REFUND;
  //       payment.refundProcessedAt = new Date();
  //       await payment.save();

  //       // Update order amountPaid
  //       const order = await Order.findById(payment.orderId);
  // if (order) {
  //   const totalPaid = await Payment.aggregate([
  //     { $match: { orderId: order._id, status: PaymentStatus.SUCCESS } },
  //     { $group: { _id: null, total: { $sum: "$amount" } } }
  //   ]);
  //   const totalRefundedAmt = await Payment.aggregate([
  //     { $match: { orderId: order._id, status: { $in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIAL_REFUND] } } },
  //     { $group: { _id: null, total: { $sum: "$refundedAmount" } } }
  //   ]);
  //   order.amountPaid = (totalPaid[0]?.total || 0) - (totalRefundedAmt[0]?.total || 0);
  //   order.paymentStatus = order.amountPaid <= 0 ? "refunded" : "partial";
  //   order.paidAt = order.amountPaid <= 0 ? null : order.paidAt;
  //   await order.save();
  //       // const order = await Order.findById(payment.orderId);
  //       // if (order) {
  //       //   order.amountPaid -= refund.amount / 100; // convert to currency unit
  //       //   if (order.amountPaid <= 0) {
  //       //     order.paymentStatus = "refunded";
  //       //     order.paidAt = null;
  //       //   } else {
  //       //     order.paymentStatus = "partial";
  //       //   }
  //       //   await order.save();
  //       }
  //     }
  //   }

  //   res.status(200).json({ received: true });
  // };

  handleRazorpayWebhook = async (req: Request, res: Response) => {
    try {
      const { event, payload } = req.body;

      if (event === "refund.processed") {
        const refund = payload.refund.entity;
        // Find the payment that contains this refund
        const payment = await Payment.findOne({
          transactionId: refund.payment_id,
          "refundHistory.refundId": refund.id,
        });

        if (!payment) {
          console.warn(`Payment not found for refund ${refund.id}`);
          res.status(404).json({ message: "Payment not found" });
          return;
        }

        // Update the matching refund entry inside the array
        const refundEntry = payment.refundHistory.find(
          (r) => r.refundId === refund.id
        );
        if (refundEntry) {
          refundEntry.refundProcessedAt = new Date(refund.created_at * 1000); // convert from Unix seconds
        }

        // Recalculate payment status
        const totalRefunded = payment.refundHistory.reduce(
          (sum, r) => sum + r.refundAmount,
          0
        );
        payment.refundedAmount = totalRefunded;
        if (totalRefunded > payment.amount) {
          console.warn(
            `Refund amount ${totalRefunded} exceeds payment amount ${payment.amount}`
          );
        } else if (totalRefunded === payment.amount) {
          payment.status = PaymentStatus.REFUNDED;
        } else if (totalRefunded > 0) {
          payment.status = PaymentStatus.PARTIAL_REFUND;
        }

        await payment.save();

        // Update order's amountPaid & status
        const order = await Order.findById(payment.orderId);
        if (order) {
          // Calculate total successful payments
          type PaymentAgg = { _id: null; total: number };
          const totalPaidAgg = await Payment.aggregate<PaymentAgg>([
            { $match: { orderId: order._id, status: PaymentStatus.SUCCESS } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]);

          // Calculate total refunded across all payments for this order
          const totalRefundedAmtAgg = await Payment.aggregate<PaymentAgg>([
            {
              $match: {
                orderId: order._id,
                status: {
                  $in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIAL_REFUND],
                },
              },
            },
            { $group: { _id: null, total: { $sum: "$refundedAmount" } } },
          ]);

          order.amountPaid =
            (totalPaidAgg[0]?.total ?? 0) -
            (totalRefundedAmtAgg[0]?.total ?? 0);

          if (order.amountPaid <= 0) {
            order.paymentStatus = "refunded";
            order.paidAt = null;
          } else if (order.amountPaid < order.totalAmount) {
            order.paymentStatus = "partial";
          }

          await order.save();
        }

        await RefundRequest.findOneAndUpdate(
          { paymentId: payment._id, status: "initiated" },
          { status: "processed" }
        );

        res
          .status(200)
          .json({ message: "Refund status updated", received: true });
      }
    } catch (err) {
      console.error("Refund webhook error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  requestRefund = async (req: Request, res: Response) => {
    const { paymentId, amount, reason } = req.body; //amoount in paise
    const firebaseUID = req.user.uid;
    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      const userId = user._id;

      const payment = await Payment.findById(paymentId);
      if (!payment || payment.userId.toString() !== userId.toString()) {
        res.status(403).json({ message: "Invalid payment" });
        return;
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        res.status(400).json({ message: "Refund not allowed" });
        return;
      }

      if ((amount / 100) > payment.amount) {
        res.status(400).json({ message: "Invalid refund amount" });
        return;
      }

      const refundReq = await RefundRequest.create({
        paymentId,
        userId,
        amount, //in paise
        reason,
        status: "pending",
      });

      res.json({ message: "Refund request submitted", refundReq });
    } catch (err) {
      console.error("Refund request error:", err);
      res.status(500).json({ message: "Internal server error", error: err });
    }
  };

  rejectRefund = async (req: Request, res: Response) => {
    const { requestId } = req.params;
    if (!requestId) {
      res.status(400).json({ message: "requestId is required" });
      return;
    }
    try {
      const refundReq = await RefundRequest.findById(requestId);

      if (!refundReq || refundReq.status !== "pending") {
        res
          .status(400)
          .json({ message: "Invalid or already processed request" });
        return;
      }
      refundReq.status = "rejected";
      await refundReq.save();

      res.json({ message: "Refund request rejected" });
    } catch (err) {
      console.error("Reject refund error:", err);
      res.status(500).json({ message: "Internal server error", error: err });
    }
  };

  // Helper method to deduct inventory when payment is completed
  async deductInventoryFromOrder(order: any) {
    const session = await (await import("mongoose")).default.startSession();
    session.startTransaction();
    try {
      const typeToRefMap: Record<string, string> = {
        lenses: "lensRef",
        frames: "frameRef",
        accessories: "accessoriesRef",
        sunglasses: "sunglassesRef",
        eyeglasses: "eyeglassesRef",
      };

      for (const item of order.items) {
        if (!item.warehouseId) {
          await session.abortTransaction();
          throw new Error(
            `Warehouse not assigned for product ${item.productId} in order ${order._id}`
          );
        }

        // Atomically decrement stock with guard
        const inventory = await Inventory.findOneAndUpdate(
          {
            productId: item.productId,
            warehouseId: item.warehouseId,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!inventory) {
          await session.abortTransaction();
          throw new Error(
            `Insufficient inventory for product ${item.productId} in warehouse ${item.warehouseId}`
          );
        }

        // Update product aggregate stock on subdoc
        const product = await Product.findById(item.productId).session(session);
        if (product) {
          const refField = typeToRefMap[product.type];
          if (refField) {
            const populatedProduct = await product.populate<{
              [k: string]: { stock: number } | null;
            }>({
              path: refField,
              select: "stock",
            });
            const subDoc = (populatedProduct as any)[refField];
            if (subDoc) {
              type TotalStockAgg = { _id: null; totalStock: number };
              const totalStockAgg = await Inventory.aggregate<TotalStockAgg>([
                { $match: { productId: product._id } },
                { $group: { _id: null, totalStock: { $sum: "$stock" } } },
              ]).session(session);
              subDoc.stock = totalStockAgg[0]?.totalStock ?? 0;
              await subDoc.save({ session });
            }
          }
        }
      }

      await session.commitTransaction();
    } catch (error) {
      console.error("Error deducting inventory:", error);
      try {
        await session.abortTransaction();
      } catch {}
      throw error;
    } finally {
      session.endSession();
    }
  }

  getAllRefundRequests = async (req: Request, res: Response) => {
    const {skip,take} = req.pagination!;
  try {
    const refundRequests = await RefundRequest.find()
      .populate({
        path: "userId",
        select: "fullName email",
      })
      .populate({
        path: "paymentId",
        select: "amount status transactionId orderId",
      })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(take));
    const total = await RefundRequest.countDocuments();

    res.json({
      message: "Refund requests fetched successfully",
      data:refundRequests,
      total,
      skip: Number(skip),
      take: Number(take),
      totalPages: Math.ceil(total / Number(take)),
    });
  } catch (err) {
    console.error("Error fetching refund requests:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

}

export default new PaymentController();
