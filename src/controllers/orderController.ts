import { Order } from "../models/orderModel";
import { Cart } from "../models/cartModel";
import { Product } from "../models/productModel";
import express from "express";
import { Lens } from "../models/lensModel";

class OrderController {
  createOrder = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      prescriptionId,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Order items are required" });
      return;
    }

    if (!shippingAddress || !billingAddress || !paymentMethod) {
      res.status(400).json({ 
        message: "Shipping address, billing address, and payment method are required" 
      });
      return;
    }

    try {
      // Calculate order totals
      let totalAmount = 0;
      let discountAmount = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          res.status(400).json({ message: `Product with ID ${item.productId} not found` });
          return;
        }
        
        const populatedProduct = await product.populate<{ lensRef: { price: number } | null }>('lensRef', 'price');
        const itemTotal = product.finalPrice * item.quantity;
        const lensPrice = populatedProduct.lensRef && typeof populatedProduct.lensRef === 'object' && 'price' in populatedProduct.lensRef
          ? populatedProduct.lensRef.price
          : product.finalPrice;
        const itemDiscount = (lensPrice - product.finalPrice) * item.quantity;
        
        totalAmount += itemTotal;
        discountAmount += itemDiscount;
      }

      const finalAmount = totalAmount;

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const order = new Order({
        userId: firebaseUID,
        orderNumber,
        items,
        totalAmount,
        discountAmount,
        finalAmount,
        shippingAddress,
        billingAddress,
        paymentMethod,
        prescriptionId,
        notes,
      });

      const savedOrder = await order.save();

      // Clear user's cart after successful order
      await Cart.findOneAndUpdate(
        { userId: firebaseUID },
        { items: [] }
      );

      res.status(201).json(savedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error creating order", error });
    }
  };

  getOrdersByUser = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }

    try {
      const orders = await Order.find({ userId: firebaseUID })
        .populate('items.productId')
        .populate('prescriptionId')
        .sort({ createdAt: -1 });

      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  };

  getOrderById = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const firebaseUID = req.user?.uid;

    if (!id) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }

    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }

    try {
      const order = await Order.findOne({ _id: id, userId: firebaseUID })
        .populate('items.productId')
        .populate('prescriptionId');

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order", error });
    }
  };

  updateOrderStatus = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }

    if (!status) {
      res.status(400).json({ message: "Status is required" });
      return;
    }

    const allowedStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('items.productId')
       .populate('prescriptionId');

      if (!updatedOrder) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating order status", error });
    }
  };

  updatePaymentStatus = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!id) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }

    if (!paymentStatus) {
      res.status(400).json({ message: "Payment status is required" });
      return;
    }

    const allowedPaymentStatuses = ["pending", "completed", "failed", "refunded"];
    if (!allowedPaymentStatuses.includes(paymentStatus)) {
      res.status(400).json({ message: "Invalid payment status value" });
      return;
    }

    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { paymentStatus },
        { new: true }
      ).populate('items.productId')
       .populate('prescriptionId');

      if (!updatedOrder) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating payment status", error });
    }
  };

  addTrackingInfo = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { trackingNumber, estimatedDelivery } = req.body;

    if (!id) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }

    if (!trackingNumber) {
      res.status(400).json({ message: "Tracking number is required" });
      return;
    }

    try {
      const updateData: any = { trackingNumber };
      if (estimatedDelivery) {
        updateData.estimatedDelivery = new Date(estimatedDelivery);
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('items.productId')
       .populate('prescriptionId');

      if (!updatedOrder) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating tracking information", error });
    }
  };

  cancelOrder = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const firebaseUID = req.user?.uid;

    if (!id) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }

    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }

    try {
      const order = await Order.findOne({ _id: id, userId: firebaseUID });
      
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.status === "delivered" || order.status === "shipped") {
        res.status(400).json({ message: "Cannot cancel order that is already shipped or delivered" });
        return;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status: "cancelled" },
        { new: true }
      ).populate('items.productId')
       .populate('prescriptionId');

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error cancelling order", error });
    }
  };

  getAllOrders = async (req: express.Request, res: express.Response) => {
    try {
      const orders = await Order.find()
        .populate('items.productId')
        .populate('prescriptionId')
        .sort({ createdAt: -1 });

      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  };



trackOrder = async (req: express.Request, res: express.Response): Promise<void> => {
  const { orderNumber } = req.params;
  const firebaseUID = req.user?.uid;

  if (!orderNumber) {
    res.status(400).json({ message: "Order number is required" });
    return;
  }
  if (!firebaseUID) {
    res.status(400).json({ message: "Firebase ID is required" });
    return;
  }
  try {
    const order = await Order.findOne({ orderNumber, userId: firebaseUID })
      .select("orderNumber status trackingNumber estimatedDelivery notes items shippingAddress createdAt")
      .populate("items.productId", "name image price finalPrice")
      .lean();

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ message: "Error tracking order", error });
  }
};


}

export default new OrderController();
