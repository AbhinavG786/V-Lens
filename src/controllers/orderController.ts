import { Order } from "../models/orderModel";
import { Cart } from "../models/cartModel";
import { Product } from "../models/productModel";
import { User } from "../models/userModel";
import { Inventory } from "../models/inventoryModel";
import { Warehouse } from "../models/warehouseModel";
import express from "express";
import { generateInvoicePDF } from "../utils/invoiceGenerator";
import { razorpay } from "../utils/razorpay";
import { PaymentStatus, Payment } from "../models/paymentModel";

class OrderController {
  // createOrder = async (req: express.Request, res: express.Response) => {
  //   const firebaseUID = req.user?.uid;
  //   if (!firebaseUID) {
  //     res.status(400).json({ message: "Firebase ID is required" });
  //     return;
  //   }

  //   const {
  //     items,
  //     shippingAddress,
  //     billingAddress,
  //     paymentMethod,
  //     prescriptionId,
  //     notes,
  //   } = req.body;

  //   if (!items || !Array.isArray(items) || items.length === 0) {
  //     res.status(400).json({ message: "Order items are required" });
  //     return;
  //   }

  //   if (!shippingAddress || !billingAddress || !paymentMethod) {
  //     res.status(400).json({
  //       message: "Shipping address, billing address, and payment method are required"
  //     });
  //     return;
  //   }

  //   try {
  //     // Calculate order totals
  //     let totalAmount = 0;
  //     let discountAmount = 0;
  //      const typeToRefMap: Record<string, string> = {
  //         lenses: "lensRef",
  //         frames: "frameRef",
  //         accessories: "accessoriesRef",
  //         sunglasses: "sunglassesRef",
  //         eyeglasses: "eyeglassesRef",
  //       };

  //     for (const item of items) {
  //       const product = await Product.findById(item.productId);
  //       if (!product) {
  //         res.status(400).json({ message: `Product with ID ${item.productId} not found` });
  //         return;
  //       }

  //       // const populatedProduct = await product.populate<{ lensRef: { price: number } | null }>('lensRef', 'price');
  //       // const itemTotal = product.finalPrice * item.quantity;
  //       // const lensPrice = populatedProduct.lensRef && typeof populatedProduct.lensRef === 'object' && 'price' in populatedProduct.lensRef
  //       //   ? populatedProduct.lensRef.price
  //       //   : product.finalPrice;
  //       // const itemDiscount = (lensPrice - product.finalPrice) * item.quantity;

  //       const refField = typeToRefMap[product.type];
  //       if (refField) {
  //         const populatedProduct = await product.populate<{
  //           [key: string]: { discount:number,finalPrice:number } | null;
  //         }>({
  //           path: refField,
  //           select: "discount finalPrice",
  //         });
  //         const subDoc = (populatedProduct as any)[refField];
  //       if(subDoc){
  //         const itemTotal = subDoc.finalPrice * item.quantity;
  //         const itemDiscount = subDoc.discount * item.quantity;
  //       totalAmount += itemTotal;
  //       discountAmount += itemDiscount;
  //       }
  //       }
  //     }

  //     const finalAmount = totalAmount;

  //     // Generate unique order number
  //     const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  //     const order = new Order({
  //       userId: firebaseUID,
  //       orderNumber,
  //       items,
  //       totalAmount,
  //       discountAmount,
  //       finalAmount,
  //       shippingAddress,
  //       billingAddress,
  //       paymentMethod,
  //       prescriptionId,
  //       notes,
  //     });

  //     const savedOrder = await order.save();

  //     // Clear user's cart after successful order
  //     await Cart.findOneAndUpdate(
  //       { userId: firebaseUID },
  //       { items: [] }
  //     );

  //     res.status(201).json(savedOrder);
  //   } catch (error) {
  //     res.status(500).json({ message: "Error creating order", error });
  //   }
  // };

  createOrder = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      prescriptionId,
      notes,
      isGSTPurchase,
      gstNumber,
      companyName,
      registrationNumber,
      companyAddress,
    } = req.body;

    if (!firebaseUID) {
      res.status(400).json({ message: "Firebase ID is required" });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Order items are required" });
      return;
    }
    if (!shippingAddress || !billingAddress || !paymentMethod) {
      res.status(400).json({
        message:
          "Shipping address, billing address, and payment method are required",
      });
      return;
    }
    if (paymentMethod) {
      const allowedMethods = (Order.schema.path("paymentMethod") as any)
        .enumValues;
      if (!allowedMethods.includes(paymentMethod)) {
        res.status(400).json({
          message: `Invalid payment method. Allowed methods are: ${allowedMethods.join(
            ", "
          )}`,
        });
        return;
      }
    }

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      let subtotal = 0;
      let discountAmount = 0;
      let gstAmountTotal = 0;

      const GST_RATE = 18; // example: 18% GST for spectacle products
      const orderItems = [];

      const typeToRefMap: Record<string, string> = {
        lenses: "lensRef",
        frames: "frameRef",
        accessories: "accessoriesRef",
        sunglasses: "sunglassesRef",
        eyeglasses: "eyeglassesRef",
      };

      // First, validate stock availability for all items
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          res
            .status(400)
            .json({ message: `Product with ID ${item.productId} not found` });
          return;
        }

        // Check total stock across all warehouses
        const totalStock = await Inventory.aggregate([
          { $match: { productId: product._id } },
          { $group: { _id: null, totalStock: { $sum: "$stock" } } },
        ]);

        const availableStock = totalStock[0]?.totalStock || 0;
        if (availableStock < item.quantity) {
          res.status(400).json({
            message: `Insufficient stock for product ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
          });
          return;
        }
      }

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          res
            .status(400)
            .json({ message: `Product with ID ${item.productId} not found` });
          return;
        }

        const refField = typeToRefMap[product.type];
        if (refField) {
          const populatedProduct = await product.populate<{
            [key: string]: { discount: number; finalPrice: number } | null;
          }>({
            path: refField,
            select: "discount finalPrice",
          });

          const subDoc = (populatedProduct as any)[refField];
          if (subDoc) {
            const pricePerUnit = subDoc.finalPrice;
            const discountPerUnit = subDoc.discount;
            const gstPerUnit = isGSTPurchase
              ? (pricePerUnit * GST_RATE) / 100
              : 0;
            const initialPrice = subDoc.price;

            subtotal += pricePerUnit * item.quantity;
            discountAmount += discountPerUnit * item.quantity;
            gstAmountTotal += gstPerUnit * item.quantity;

            orderItems.push({
              productId: item.productId,
              quantity: item.quantity,
              price: initialPrice,
              discount: discountPerUnit,
              finalPrice: pricePerUnit,
              gstAmount: gstPerUnit,
              warehouseId: null, // Admin will assign later
            });
          }
        }
      }

      const totalAmount = subtotal - discountAmount + gstAmountTotal;

      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const order = new Order({
        userId: user._id,
        orderNumber,
        items: orderItems,
        subTotalAmount: subtotal,
        discountAmount,
        gstDetails: {
          isGSTPurchase: !!isGSTPurchase,
          gstNumber,
          companyName,
          registrationNumber,
          companyAddress,
          gstRate: isGSTPurchase ? GST_RATE : 0,
          gstAmount: gstAmountTotal,
        },
        totalAmount,
        shippingAddress,
        billingAddress,
        paymentMethod,
        prescriptionId,
        notes,
      });

      const savedOrder = await order.save();

      await Cart.findOneAndUpdate({ userId: user._id }, { items: [] });

      const invoicePath = (await generateInvoicePDF(savedOrder)) as string;
      savedOrder.invoiceUrl = invoicePath;
      await savedOrder.save();

      // Handle different payment methods
      if (paymentMethod === "cod") {
        // For COD, deduct inventory immediately since stock is reserved
        await this.deductInventoryFromOrder(savedOrder);
        
        res.status(201).json({
          Order: savedOrder,
          message: "COD order created successfully. Inventory deducted. Admin will assign warehouses.",
        });
      } else {
        // For online payments, create Razorpay order
        const options = {
          amount: Math.round(savedOrder.totalAmount * 100), // paise
          currency: "INR",
          receipt: orderNumber,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        if (!razorpayOrder) {
          res.status(500).json({ message: "Failed to create Razorpay order" });
          return;
        }

        const payment = new Payment({
          userId: user._id,
          orderId: savedOrder._id,
          amount: savedOrder.totalAmount,
          method: savedOrder.paymentMethod,
          razorpayOrderId: razorpayOrder.id,
          status: PaymentStatus.PENDING,
        });

        const savedPayment = await payment.save();

        await savedOrder.updateOne({ $push: { payments: savedPayment._id } });

        res.status(201).json({
          Order: savedOrder,
          RazorpayOrder: razorpayOrder,
          PreVerificationPaymentDoc: savedPayment,
        });
      }
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
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const orders = await Order.find({ userId: user._id })
        .populate("items.productId")
        .populate("prescriptionId")
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
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const order = await Order.findOne({ _id: id, userId: user._id })
        .populate("items.productId")
        .populate("prescriptionId");

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

    // const allowedStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
    const allowedStatuses = (Order.schema.path("status") as any).enumValues;
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      )
        .populate("items.productId")
        .populate("prescriptionId");

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

    // const allowedPaymentStatuses = ["pending", "completed", "failed", "refunded"];
    const allowedPaymentStatuses = (Order.schema.path("paymentStatus") as any)
      .enumValues;
    if (!allowedPaymentStatuses.includes(paymentStatus)) {
      res.status(400).json({ message: "Invalid payment status value" });
      return;
    }

    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { paymentStatus },
        { new: true }
      )
        .populate("items.productId")
        .populate("prescriptionId");

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

      const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
        new: true,
      })
        .populate("items.productId")
        .populate("prescriptionId");

      if (!updatedOrder) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating tracking information", error });
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
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const order = await Order.findOne({ _id: id, userId: user._id });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.status === "delivered" || order.status === "shipped") {
        res.status(400).json({
          message: "Cannot cancel order that is already shipped or delivered",
        });
        return;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status: "cancelled" },
        { new: true }
      )
        .populate("items.productId")
        .populate("prescriptionId");

      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error cancelling order", error });
    }
  };

  getAllOrders = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const orders = await Order.find()
        .skip(Number(skip))
        .limit(Number(take))
        .populate("items.productId")
        .populate("prescriptionId")
        .sort({ createdAt: -1 });
      const total = await Order.countDocuments();

      res.status(200).json({
        data: orders,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  };

  trackOrder = async (
    req: express.Request,
    res: express.Response
  ): Promise<void> => {
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
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const order = await Order.findOne({ orderNumber, userId: user._id })
        .select(
          "orderNumber status trackingNumber estimatedDelivery notes items shippingAddress createdAt codStatus"
        )
        .populate("items.productId", "name image price finalPrice")
        .populate("items.warehouseId", "warehouseName address")
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

  // Admin Methods for Warehouse Assignment and COD Management
  assignWarehouseToOrderItems = async (req: express.Request, res: express.Response) => {
    const { orderId } = req.params;
    const { itemAssignments } = req.body; // Array of { productId, warehouseId }

    if (!orderId || !itemAssignments || !Array.isArray(itemAssignments)) {
      res.status(400).json({ message: "Order ID and item assignments are required" });
      return;
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Validate warehouse availability and update assignments
      for (const assignment of itemAssignments) {
        const { productId, warehouseId } = assignment;
        
        // Find the order item
        const orderItem = order.items.find(item => item.productId.toString() === productId);
        if (!orderItem) {
          res.status(400).json({ message: `Product ${productId} not found in order` });
          return;
        }

        // For COD orders, inventory was already deducted at order creation
        // We just need to assign the warehouse without checking stock again
        if (order.paymentMethod === 'cod') {
          orderItem.warehouseId = warehouseId;
        } else {
          // For online payments, check warehouse stock before assignment
          const warehouseInventory = await Inventory.findOne({
            productId,
            warehouseId,
          });

          if (!warehouseInventory || warehouseInventory.stock < orderItem.quantity) {
            res.status(400).json({
              message: `Insufficient stock in warehouse for product ${productId}. Available: ${warehouseInventory?.stock || 0}, Required: ${orderItem.quantity}`,
            });
            return;
          }

          // Assign warehouse to the item
          orderItem.warehouseId = warehouseId;
        }
      }

      await order.save();
      res.status(200).json({ message: "Warehouses assigned successfully", order });
    } catch (error) {
      res.status(500).json({ message: "Error assigning warehouses", error });
    }
  };

  updateCODStatus = async (req: express.Request, res: express.Response) => {
    const { orderId } = req.params;
    const { statusField, value } = req.body; // statusField: 'orderConfirmed' | 'inTransit' | 'orderDelivered'

    if (!orderId || !statusField || typeof value !== 'boolean') {
      res.status(400).json({ message: "Order ID, status field, and value are required" });
      return;
    }

    const validFields = ['orderConfirmed', 'inTransit', 'orderDelivered'];
    if (!validFields.includes(statusField)) {
      res.status(400).json({ message: "Invalid status field" });
      return;
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.paymentMethod !== 'cod') {
        res.status(400).json({ message: "COD status can only be updated for COD orders" });
        return;
      }

      // Initialize codStatus if it doesn't exist
      if (!order.codStatus) {
        order.codStatus = {
          orderConfirmed: false,
          inTransit: false,
          orderDelivered: false,
        };
      }

      // Update the specific field
      (order.codStatus as any)[statusField] = value;

      // Set timestamp for when status was set to true
      if (value) {
        const timestampField = statusField.replace('order', '').replace('Order', '').toLowerCase() + 'At';
        if (statusField === 'orderConfirmed') {
          (order.codStatus as any).confirmedAt = new Date();
        } else if (statusField === 'inTransit') {
          (order.codStatus as any).transitAt = new Date();
        } else if (statusField === 'orderDelivered') {
          (order.codStatus as any).deliveredAt = new Date();
          // If order is delivered, mark payment as completed for COD
          order.paymentStatus = 'completed';
          order.amountPaid = order.totalAmount;
          order.paidAt = new Date();
          // Note: Inventory was already deducted when COD order was created
        }
      }

      await order.save();
      res.status(200).json({ message: "COD status updated successfully", order });
    } catch (error) {
      res.status(500).json({ message: "Error updating COD status", error });
    }
  };

  getAvailableWarehouses = async (req: express.Request, res: express.Response) => {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    try {
      const availableWarehouses = await Inventory.find({
        productId,
        stock: { $gt: 0 },
      })
        .populate('warehouseId', 'warehouseName address contactNumber')
        .select('stock warehouseId');

      res.status(200).json({ availableWarehouses });
    } catch (error) {
      res.status(500).json({ message: "Error fetching available warehouses", error });
    }
  };

  // Helper method to deduct inventory from order
  private async deductInventoryFromOrder(order: any) {
    try {
      const typeToRefMap: Record<string, string> = {
        lenses: "lensRef",
        frames: "frameRef",
        accessories: "accessoriesRef",
        sunglasses: "sunglassesRef",
        eyeglasses: "eyeglassesRef",
      };

      for (const item of order.items) {
        // For COD orders, we need to deduct from total inventory since warehouse isn't assigned yet
        if (!item.warehouseId) {
          // Find all warehouses with this product and deduct proportionally
          const inventories = await Inventory.find({ productId: item.productId });
          let remainingQuantity = item.quantity;

          for (const inventory of inventories) {
            if (remainingQuantity <= 0) break;
            
            const deductAmount = Math.min(inventory.stock, remainingQuantity);
            inventory.stock -= deductAmount;
            remainingQuantity -= deductAmount;
            await inventory.save();
          }

          // Update product total stock
          const product = await Product.findById(item.productId);
          if (product) {
            const refField = typeToRefMap[product.type];
            if (refField) {
              const populatedProduct = await product.populate<{
                [key: string]: { stock: number } | null;
              }>({
                path: refField,
                select: "stock",
              });
              const subDoc = (populatedProduct as any)[refField];
              if (subDoc) {
                // Recalculate total stock across all warehouses
                const totalStock = await Inventory.aggregate([
                  { $match: { productId: product._id } },
                  { $group: { _id: null, totalStock: { $sum: "$stock" } } },
                ]);
                subDoc.stock = totalStock[0]?.totalStock || 0;
                await subDoc.save();
              }
            }
          }
        } else {
          // If warehouse is assigned, deduct from specific warehouse
          const inventory = await Inventory.findOne({
            productId: item.productId,
            warehouseId: item.warehouseId,
          });

          if (inventory && inventory.stock >= item.quantity) {
            inventory.stock -= item.quantity;
            await inventory.save();

            // Update product total stock
            const product = await Product.findById(item.productId);
            if (product) {
              const refField = typeToRefMap[product.type];
              if (refField) {
                const populatedProduct = await product.populate<{
                  [key: string]: { stock: number } | null;
                }>({
                  path: refField,
                  select: "stock",
                });
                const subDoc = (populatedProduct as any)[refField];
                if (subDoc) {
                  // Recalculate total stock across all warehouses
                  const totalStock = await Inventory.aggregate([
                    { $match: { productId: product._id } },
                    { $group: { _id: null, totalStock: { $sum: "$stock" } } },
                  ]);
                  subDoc.stock = totalStock[0]?.totalStock || 0;
                  await subDoc.save();
                }
              }
            }
          } else {
            console.error(`Insufficient inventory for product ${item.productId} in warehouse ${item.warehouseId}`);
          }
        }
      }
    } catch (error) {
      console.error("Error deducting inventory:", error);
    }
  }
}

export default new OrderController();
