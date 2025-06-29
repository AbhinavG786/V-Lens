import express from "express";
import { Wishlist } from "../models/wishlistModel";
import { User } from "../models/userModel";
import { Product } from "../models/productModel";
import mongoose from "mongoose";

class WishlistController {
  // Add product to wishlist
  addToWishlist = async (req: express.Request, res: express.Response) => {
    try {
      const { userId, productId, source = "web", isFavorite = true } = req.body;

      if (!userId || !productId) {
        res.status(400).json({ 
          message: "Missing required fields: userId and productId" 
        });
        return;
      }

      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid userId or productId format" 
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

      // Check if user exists
      const user = await User.findById(userId);
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
      const existingWishlistItem = await Wishlist.findOne({ userId, productId });
      if (existingWishlistItem) {
        res.status(400).json({ message: "Product already in wishlist" });
        return;
      }

      // Add to wishlist
      const wishlistItem = new Wishlist({
        userId,
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
      const { userId } = req.params;
      const { source, isFavorite, sortBy = "addedAt", sortOrder = "desc" } = req.query;

      if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Invalid user ID format" });
        return;
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Build query
      const query: any = { userId };
      
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
        .sort(sortObj);

      res.status(200).json({
        message: "Wishlist retrieved successfully",
        count: wishlistItems.length,
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
      const { userId, productId } = req.params;

      if (!userId || !productId) {
        res.status(400).json({ 
          message: "Missing required parameters: userId and productId" 
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid userId or productId format" 
        });
        return;
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Remove from wishlist
      const deletedItem = await Wishlist.findOneAndDelete({ userId, productId });

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
      const { userId, productId } = req.params;

      if (!userId || !productId) {
        res.status(400).json({ 
          message: "Missing required parameters: userId and productId" 
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid userId or productId format" 
        });
        return;
      }

      const wishlistItem = await Wishlist.findOne({ userId, productId });

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
      const { userId, productId } = req.params;
      const { isFavorite, source } = req.body;

      if (!userId || !productId) {
        res.status(400).json({ 
          message: "Missing required parameters: userId and productId" 
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ 
          message: "Invalid userId or productId format" 
        });
        return;
      }

      // Validate source enum if provided
      if (source) {
        const validSources = ["web", "mobile", "android", "ios"];
        if (!validSources.includes(source)) {
          res.status(400).json({ 
            message: "Invalid source. Must be one of: web, mobile, android, ios" 
          });
          return;
        }
      }

      // Build update object
      const updateObj: any = {};
      if (isFavorite !== undefined) {
        updateObj.isFavorite = isFavorite;
      }
      if (source) {
        updateObj.source = source;
      }

      const updatedItem = await Wishlist.findOneAndUpdate(
        { userId, productId },
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

  // Clear entire wishlist for a user
  clearWishlist = async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      const { source } = req.query;

      if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Invalid user ID format" });
        return;
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Build query
      const query: any = { userId };
      if (source) {
        query.source = source;
      }

      // Delete wishlist items for the user
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

  // Get wishlist count for a user
  getWishlistCount = async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      const { source, isFavorite } = req.query;

      if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Invalid user ID format" });
        return;
      }

      // Build query
      const query: any = { userId };
      
      if (source) {
        query.source = source;
      }
      
      if (isFavorite !== undefined) {
        query.isFavorite = isFavorite === "true";
      }

      const count = await Wishlist.countDocuments(query);

      res.status(200).json({
        userId,
        wishlistCount: count,
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

  // Get analytics data (for admin purposes)
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
      const uniqueUsers = await Wishlist.distinct("userId", dateFilter);
      const uniqueProducts = await Wishlist.distinct("productId", dateFilter);

      // Get source distribution
      const sourceDistribution = await Wishlist.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get most wished products
      const mostWishedProducts = await Wishlist.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$productId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" }
      ]);

      res.status(200).json({
        message: "Wishlist analytics retrieved successfully",
        analytics: {
          totalWishlistItems,
          uniqueUsers: uniqueUsers.length,
          uniqueProducts: uniqueProducts.length,
          sourceDistribution,
          mostWishedProducts,
        },
        filters: { startDate, endDate, source },
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