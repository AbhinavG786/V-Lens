import express from "express";
import {Recommendation} from "../models/recommendationModel";

// GET /recommendations/:userId
export class RecommendationController {
   getRecommendationsForUser=async(req:express.Request, res:express.Response) => {
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
  } catch (err: any) {
    console.error("Error fetching recommendations:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
}
export default new RecommendationController();