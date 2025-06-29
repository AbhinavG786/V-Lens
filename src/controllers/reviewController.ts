import { Review } from "../models/reviewModel";
import { Product } from "../models/productModel";
import { User } from "../models/userModel";
import express from "express";

class ReviewController {
  createReview = async (req: express.Request, res: express.Response) => {
    const { productId, rating, comment } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!productId || !rating || !comment) {
      res.status(400).json({
        message: "Missing required fields: productId, rating, comment",
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
      return;
    }

    try {
      const user = await User.findOne({ firebaseUID: userId });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const existingReview = await Review.findOne({
        userId: user._id,
        productId,
      });
      if (existingReview) {
        res.status(400).json({
          message: "You have already reviewed this product",
        });
        return;
      }

      const review = new Review({
        userId: user._id,
        productId,
        rating,
        comment,
      });

      await review.save();
      await this.updateProductRating(productId);

      const populatedReview = await Review.findById(review._id)
        .populate("userId", "fullName");

      res.status(201).json({
        message: "Review created successfully",
        review: populatedReview,
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating review", error });
    }
  };

  getProductReviews = async (req: express.Request, res: express.Response) => {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const reviews = await Review.find({ productId })
        .populate("userId", "fullName")
        .sort({ createdAt: -1 });

      res.status(200).json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews", error });
    }
  };

  getUserReviews = async (req: express.Request, res: express.Response) => {
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    try {
      const user = await User.findOne({ firebaseUID: userId });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const reviews = await Review.find({ userId: user._id })
        .populate("productId", "name brand")
        .sort({ createdAt: -1 });

      res.status(200).json({ reviews });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user reviews", error });
    }
  };

  updateReview = async (req: express.Request, res: express.Response) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!reviewId) {
      res.status(400).json({ message: "Review ID is required" });
      return;
    }

    try {
      const user = await User.findOne({ firebaseUID: userId });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const review = await Review.findOne({ _id: reviewId, userId: user._id });
      if (!review) {
        res.status(404).json({
          message: "Review not found or you don't have permission to update it",
        });
        return;
      }

      const updateData: any = {};
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          res.status(400).json({ message: "Rating must be between 1 and 5" });
          return;
        }
        updateData.rating = rating;
      }
      if (comment !== undefined) updateData.comment = comment;

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        updateData,
        { new: true }
      ).populate("userId", "fullName");

      if (rating !== undefined) {
        await this.updateProductRating(review.productId.toString());
      }

      res.status(200).json({
        message: "Review updated successfully",
        review: updatedReview,
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating review", error });
    }
  };

  deleteReview = async (req: express.Request, res: express.Response) => {
    const { reviewId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!reviewId) {
      res.status(400).json({ message: "Review ID is required" });
      return;
    }

    try {
      const user = await User.findOne({ firebaseUID: userId });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const review = await Review.findOne({ _id: reviewId, userId: user._id });
      if (!review) {
        res.status(404).json({
          message: "Review not found or you don't have permission to delete it",
        });
        return;
      }

      const productId = review.productId.toString();
      await Review.findByIdAndDelete(reviewId);
      await this.updateProductRating(productId);

      res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting review", error });
    }
  };

  private updateProductRating = async (productId: string) => {
    try {
      const reviews = await Review.find({ productId });
      
      if (reviews.length === 0) {
        await Product.findByIdAndUpdate(productId, {
          "ratings.average": 0,
          "ratings.count": 0,
        });
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await Product.findByIdAndUpdate(productId, {
        "ratings.average": Math.round(averageRating * 10) / 10,
        "ratings.count": reviews.length,
      });
    } catch (error) {
      console.error("Error updating product rating:", error);
    }
  };
}

export default new ReviewController();
