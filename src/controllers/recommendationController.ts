import express from "express";
import {Recommendation} from "../models/recommendationModel";
import { Product } from "../models/productModel";
import { Wishlist } from "../models/wishlistModel";
import { Order } from "../models/orderModel";
import { Review } from "../models/reviewModel";

// GET /recommendations/:userId
export class RecommendationController {
   getRecommendationsForUser = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Validate ObjectId (optional but safe)
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
       res.status(400).json({ message: "Invalid user ID format" });
       return
    }

    const recommendations = await Recommendation.findOne({ userId }).populate("recommendedProductIds");

    if (!recommendations) {
       res.status(404).json({ message: "No recommendations found" });
       return
    }

    // Paginate the recommendedProductIds array
    const allProducts = recommendations.recommendedProductIds || [];
    const paginatedProducts = allProducts.slice(skip, skip + Number(limit));
    const total = allProducts.length;
    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      userId,
      total,
      skip,
      take: Number(limit),
      totalPages,
      recommendedProducts: paginatedProducts
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Server error", error: errorMsg });
  }
};

setRecommendationsForUser = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    const { recommendedProductIds, source = "Manual" } = req.body;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    if (!Array.isArray(recommendedProductIds) || recommendedProductIds.length === 0) {
      return res.status(400).json({ message: "recommendedProductIds must be a non-empty array" });
    }

    const updated = await Recommendation.findOneAndUpdate(
      { userId },
      { recommendedProductIds, source },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("recommendedProductIds");

    res.status(200).json({ message: "Recommendations updated", recommendations: updated });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Server error", error: errorMsg });
  }
};

  // GET /recommendations/:userId/trending
  getTrendingRecommendations = async (req: express.Request, res: express.Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || "10");
      const trending = await Product.find()
        .sort({ "ratings.count": -1, "ratings.average": -1 })
        .limit(limit)
        .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef");
      res.status(200).json({
        strategy: "trending",
        count: trending.length,
        products: trending,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: "Error fetching trending recommendations", error: errorMsg });
    }
  };

  // GET /recommendations/:userId/collaborative
  getCollaborativeRecommendations = async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      // 1. Get user's wishlisted and ordered productIds
      const userWishlist = await Wishlist.find({ userId }).select("productId");
      const userOrders = await Order.find({ userId }).select("items.productId");
      const userProductIds = new Set([
        ...userWishlist.map(w => w.productId.toString()),
        ...userOrders.flatMap(o => o.items.map(i => i.productId.toString())),
      ]);
      // 2. Find other users who have wishlisted or ordered any of these products
      const similarWishlists = await Wishlist.find({ productId: { $in: Array.from(userProductIds) }, userId: { $ne: userId } });
      const similarUserIds = [...new Set(similarWishlists.map(w => w.userId.toString()))];
      // 3. Get products from those users' wishlists/orders, excluding already seen
      const similarUsersWishlists = await Wishlist.find({ userId: { $in: similarUserIds } });
      const similarUsersOrders = await Order.find({ userId: { $in: similarUserIds } });
      const recommendedProductIds = new Set([
        ...similarUsersWishlists.map(w => w.productId.toString()),
        ...similarUsersOrders.flatMap(o => o.items.map(i => i.productId.toString())),
      ]);
      // Remove products the user already has
      userProductIds.forEach(pid => recommendedProductIds.delete(pid));
      // 4. Fetch product details
      const products = await Product.find({ _id: { $in: Array.from(recommendedProductIds) } })
        .limit(20)
        .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef");
      res.status(200).json({
        strategy: "collaborative",
        count: products.length,
        products,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: "Error fetching collaborative recommendations", error: errorMsg });
    }
  };

  // GET /recommendations/:userId/content
  getContentBasedRecommendations = async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      // 1. Get user's wishlisted products
      const userWishlist = await Wishlist.find({ userId }).populate("productId");
      const tags = new Set();
      const types = new Set();
      userWishlist.forEach(w => {
        if (w.productId && typeof w.productId === 'object' && 'tags' in w.productId && Array.isArray(w.productId.tags)) {
          w.productId.tags.forEach((tag: string) => tags.add(tag));
        }
        if (w.productId && typeof w.productId === 'object' && 'type' in w.productId) {
          types.add((w.productId as any).type);
        }
      });
      // 2. Find products with similar tags or type, excluding already wishlisted
      const alreadyWishlisted = userWishlist.map(w => w.productId._id);
      const products = await Product.find({
        $or: [
          { tags: { $in: Array.from(tags) } },
          { type: { $in: Array.from(types) } },
        ],
        _id: { $nin: alreadyWishlisted },
      })
        .limit(20)
        .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef");
      res.status(200).json({
        strategy: "content-based",
        count: products.length,
        products,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: "Error fetching content-based recommendations", error: errorMsg });
    }
  };
}
export default new RecommendationController();