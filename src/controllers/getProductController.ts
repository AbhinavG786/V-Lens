import { Request, Response } from "express";
import { Product } from "../models/productModel"; // adjust path as needed


// Trendy Products Controller//
export const getTrendyProducts = async (req: Request, res: Response) => {
  try {
    const trendyProducts = await Product.find({})
      .sort({
        "ratings.average": -1,
        "ratings.count": -1,
      })
      .limit(10) 
      .populate("ratings.reviews")
      .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef"); // optionally populate related models

    res.status(200).json({
      success: true,
      message: "Top trendy products fetched successfully",
      products: trendyProducts,
    });
  } catch (error) {
    console.error("Error fetching trendy products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trendy products",
      error,
    });
  }
};


