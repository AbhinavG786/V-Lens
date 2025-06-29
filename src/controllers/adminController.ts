import { User } from "../models/userModel";
import { Order } from "../models/orderModel";
import { Product } from "../models/productModel";
import express from "express";

class AdminController {
  // Get admin dashboard stats
  getDashboardStats = async (req: express.Request, res: express.Response) => {
    try {
      const adminInfo = req.admin;
      
      if (!adminInfo) {
        res.status(403).json({ message: "Admin access required" });
        return;
      }

      // Get counts for dashboard
      const totalUsers = await User.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalProducts = await Product.countDocuments();
      
      // Get recent orders
      const recentOrders = await Order.find()
        .populate('items.productId')
        .sort({ createdAt: -1 })
        .limit(5);

      // Get pending orders
      const pendingOrders = await Order.countDocuments({ status: 'pending' });

      const stats = {
        totalUsers,
        totalOrders,
        totalProducts,
        pendingOrders,
        recentOrders,
        adminInfo: {
          name: adminInfo.fullName,
          email: adminInfo.email
        }
      };

      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats", error });
    }
  };

  // Get all users (admin only)
  getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
      const adminInfo = req.admin;
      
      if (!adminInfo) {
        res.status(403).json({ message: "Admin access required" });
        return;
      }

      const users = await User.find()
        .select('-__v')
        .sort({ createdAt: -1 });

      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  };

  // Update user admin status
  updateUserAdminStatus = async (req: express.Request, res: express.Response) => {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    try {
      const adminInfo = req.admin;
      
      if (!adminInfo) {
        res.status(403).json({ message: "Admin access required" });
        return;
      }

      if (typeof isAdmin !== 'boolean') {
        res.status(400).json({ message: "isAdmin must be a boolean value" });
        return;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isAdmin },
        { new: true }
      ).select('-__v');

      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error updating user admin status", error });
    }
  };

  // Delete user (admin only)
  deleteUser = async (req: express.Request, res: express.Response) => {
    const { userId } = req.params;

    try {
      const adminInfo = req.admin;
      
      if (!adminInfo) {
        res.status(403).json({ message: "Admin access required" });
        return;
      }

      // Prevent admin from deleting themselves
      if (adminInfo.uid === userId) {
        res.status(400).json({ message: "Cannot delete your own account" });
        return;
      }

      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  };

  // Get order analytics
  getOrderAnalytics = async (req: express.Request, res: express.Response) => {
    try {
      const adminInfo = req.admin;
      
      if (!adminInfo) {
        res.status(403).json({ message: "Admin access required" });
        return;
      }

      // Get orders by status
      const ordersByStatus = await Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      // Get orders by payment status
      const ordersByPaymentStatus = await Order.aggregate([
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 }
          }
        }
      ]);

      // Get total revenue
      const totalRevenue = await Order.aggregate([
        {
          $match: {
            paymentStatus: "completed"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$finalAmount" }
          }
        }
      ]);

      const analytics = {
        ordersByStatus,
        ordersByPaymentStatus,
        totalRevenue: totalRevenue[0]?.total || 0
      };

      res.status(200).json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order analytics", error });
    }
  };
}

export default new AdminController();
