import express from "express";
import { Wishlist } from "../models/wishlistModel";
import { User } from "../models/userModel";
import { Product } from "../models/productModel";
import mongoose from "mongoose";

class WishlistController {
  // Add product to wishlist
  addToWishlist = async (req: express.Request, res: express.Response) => {
    try {
      const { productId, source = "web", isFavorite = true } = req.body;
      const firebaseUID = req.user?.uid;

      if (!firebaseUID) {
        res.status(401).json({ 
          message: "User not authenticated" 
        });
        return;
      }

      if (!productId) {
        res.status(400).json({ 
          message: "Missing required field: productId" 
        });
        return;
      }

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid productId format" 
        });
        return;
      }

      // Validate source enum
      const validSources = ["web", "mobile", "android", "ios"];
      if (source && !validSources.includes(source)) {
        res.status(400).json({ 
          message: "Invalid source. Must be one of: web, mobile, android, ios" 
        });
        return;
      }

      // Get user by Firebase UID
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      // Check if already in wishlist
      const existingWishlistItem = await Wishlist.findOne({ userId: user._id, productId });
      if (existingWishlistItem) {
        res.status(400).json({ message: "Product already in wishlist" });
        return;
      }

      // Add to wishlist
      const wishlistItem = new Wishlist({
        userId: user._id,
        productId,
        source,
        isFavorite,
      });

      const savedItem = await wishlistItem.save();

      // Populate product details
      const populatedItem = await Wishlist.findById(savedItem._id).populate("productId");

      res.status(201).json({
        message: "Product added to wishlist successfully",
        wishlistItem: populatedItem,
      });
    } catch (error: any) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ 
        message: "Error adding product to wishlist", 
        error: error.message 
      });
    }
  };

  // Get user's wishlist
  getUserWishlist = async (req: express.Request, res: express.Response) => {
    try {
      const firebaseUID = req.user?.uid;
      const { source, isFavorite, sortBy = "addedAt", sortOrder = "desc" } = req.query;
      const { skip = 0, take = 10 } = req.pagination || {};

      if (!firebaseUID) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      // Get user by Firebase UID
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Build query
      const query: any = { userId: user._id };
      if (source) {
        query.source = source;
      }
      if (isFavorite !== undefined) {
        query.isFavorite = isFavorite === "true";
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      // Get wishlist items with populated product details
      const wishlistItems = await Wishlist.find(query)
        .populate("productId")
        .sort(sortObj)
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Wishlist.countDocuments(query);

      res.status(200).json({
        message: "Wishlist retrieved successfully",
        count: wishlistItems.length,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
        filters: { source, isFavorite, sortBy, sortOrder },
        wishlist: wishlistItems,
      });
    } catch (error: any) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ 
        message: "Error fetching wishlist", 
        error: error.message 
      });
    }
  };

  // Remove product from wishlist
  removeFromWishlist = async (req: express.Request, res: express.Response) => {
    try {
      const { productId } = req.params;
      const firebaseUID = req.user?.uid;

      if (!firebaseUID) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      if (!productId) {
        res.status(400).json({ 
          message: "Missing required parameter: productId" 
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid productId format" 
        });
        return;
      }

      // Get user by Firebase UID
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Remove from wishlist
      const deletedItem = await Wishlist.findOneAndDelete({ userId: user._id, productId });

      if (!deletedItem) {
        res.status(404).json({ message: "Product not found in wishlist" });
        return;
      }

      res.status(200).json({
        message: "Product removed from wishlist successfully",
        deletedItem,
      });
    } catch (error: any) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ 
        message: "Error removing product from wishlist", 
        error: error.message 
      });
    }
  };

  // Check if product is in user's wishlist
  checkWishlistStatus = async (req: express.Request, res: express.Response) => {
    try {
      const { productId } = req.params;
      const firebaseUID = req.user?.uid;

      if (!firebaseUID) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      if (!productId) {
        res.status(400).json({ 
          message: "Missing required parameter: productId" 
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid productId format" 
        });
        return;
      }

      // Get user by Firebase UID
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const wishlistItem = await Wishlist.findOne({ userId: user._id, productId });

      res.status(200).json({
        isInWishlist: !!wishlistItem,
        wishlistItem: wishlistItem || null,
      });
    } catch (error: any) {
      console.error("Error checking wishlist status:", error);
      res.status(500).json({ 
        message: "Error checking wishlist status", 
        error: error.message 
      });
    }
  };

  // Update wishlist item (toggle favorite status, update source)
  updateWishlistItem = async (req: express.Request, res: express.Response) => {
    try {
      const { productId } = req.params;
      const { isFavorite, source } = req.body;
      const firebaseUID = req.user?.uid;

      if (!firebaseUID) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      if (!productId) {
        res.status(400).json({ 
          message: "Missing required parameter: productId" 
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid productId format" 
        });
        return;
      }

      // Validate source enum if provided
      const validSources = ["web", "mobile", "android", "ios"];
      if (source && !validSources.includes(source)) {
        res.status(400).json({ 
          message: "Invalid source. Must be one of: web, mobile, android, ios" 
        });
        return;
      }

      // Get user by Firebase UID
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Build update object
      const updateObj: any = {};
      if (isFavorite !== undefined) {
        updateObj.isFavorite = isFavorite;
      }
      if (source) {
        updateObj.source = source;
      }

      // Update wishlist item
      const updatedItem = await Wishlist.findOneAndUpdate(
        { userId: user._id, productId },
        updateObj,
        { new: true }
      ).populate("productId");

      if (!updatedItem) {
        res.status(404).json({ message: "Wishlist item not found" });
        return;
      }

      res.status(200).json({
        message: "Wishlist item updated successfully",
        wishlistItem: updatedItem,
      });
    } catch (error: any) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ 
        message: "Error updating wishlist item", 
        error: error.message 
      });
    }
  };

  // Clear entire wishlist for a user (with optional source filter)
  clearWishlist = async (req: express.Request, res: express.Response) => {
    try {
      const { source } = req.query;
      const firebaseUID = req.user?.uid;

      if (!firebaseUID) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      // Get user by Firebase UID
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Build query
      const query: any = { userId: user._id };
      if (source) {
        query.source = source;
      }

      // Delete wishlist items
      const result = await Wishlist.deleteMany(query);

      res.status(200).json({
        message: "Wishlist cleared successfully",
        deletedCount: result.deletedCount,
        filters: { source },
      });
    } catch (error: any) {
      console.error("Error clearing wishlist:", error);
      res.status(500).json({ 
        message: "Error clearing wishlist", 
        error: error.message 
      });
    }
  };

  // Get wishlist count for a user (with optional filters)
  getWishlistCount = async (req: express.Request, res: express.Response) => {
    try {
      const { source, isFavorite } = req.query;
      const firebaseUID = req.user?.uid;

      if (!firebaseUID) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      // Get user by Firebase UID
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Build query
      const query: any = { userId: user._id };
      if (source) {
        query.source = source;
      }
      if (isFavorite !== undefined) {
        query.isFavorite = isFavorite === "true";
      }

      const count = await Wishlist.countDocuments(query);

      res.status(200).json({
        message: "Wishlist count retrieved successfully",
        count,
        filters: { source, isFavorite },
      });
    } catch (error: any) {
      console.error("Error getting wishlist count:", error);
      res.status(500).json({ 
        message: "Error getting wishlist count", 
        error: error.message 
      });
    }
  };

  // Get analytics data (admin endpoint)
  getWishlistAnalytics = async (req: express.Request, res: express.Response) => {
    try {
      const { startDate, endDate, source } = req.query;

      // Build date filter
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.addedAt = {};
        if (startDate) {
          dateFilter.addedAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          dateFilter.addedAt.$lte = new Date(endDate as string);
        }
      }

      // Build source filter
      if (source) {
        dateFilter.source = source;
      }

      // Get analytics data
      const totalWishlistItems = await Wishlist.countDocuments(dateFilter);
      const totalUsers = await Wishlist.distinct("userId", dateFilter).then(ids => ids.length);
      const sourceBreakdown = await Wishlist.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const favoriteBreakdown = await Wishlist.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$isFavorite", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      const dailyAdditions = await Wishlist.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$addedAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.status(200).json({
        message: "Wishlist analytics retrieved successfully",
        analytics: {
          totalWishlistItems,
          totalUsers,
          sourceBreakdown,
          favoriteBreakdown,
          dailyAdditions,
          filters: { startDate, endDate, source },
        },
      });
    } catch (error: any) {
      console.error("Error getting wishlist analytics:", error);
      res.status(500).json({ 
        message: "Error getting wishlist analytics", 
        error: error.message 
      });
    }
  };
}

export default new WishlistController();