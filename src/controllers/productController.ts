import { Product } from "../models/productModel";
import { Request, Response } from "express";
import express from "express";
import { SortOrder } from "mongoose";

class ProductController {
  getTrendingProducts = async (req: Request, res: Response) => {
    try {
      const { skip, take } = req.pagination!;
      const sortBy = (req.query.sortBy as string) || "combined";

      let sortOption: Record<string, SortOrder>;
      switch (sortBy) {
        case "reviews":
          sortOption = { "ratings.count": -1 };
          break;
        case "ratings":
          sortOption = { "ratings.average": -1 };
          break;
        case "combined":
        default:
          sortOption = {
            "ratings.average": -1,
            "ratings.count": -1,
          };
          break;
      }

      const products = await Product.find()
        .sort(sortOption)
        .skip(skip)
        .limit(take)
        .populate("ratings.reviews")
        .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef");

      const total = await Product.countDocuments();

      res.status(200).json({
        success: true,
        message: "Trending products fetched successfully",
        products,
        total,
        skip,
        take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      console.error("Error fetching trending products:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch trending products",
        error,
      });
    }
  };

  getRandomProducts = async (req: Request, res: Response) => {
    try {
      const { skip, take } = req.pagination!;
      const total = await Product.countDocuments();

      const safeSkip = Math.min(Math.max(0, skip), Math.max(0, total - take));

      const products = await Product.find()
        .skip(safeSkip)
        .limit(take)
        .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef");

      res.status(200).json({
        success: true,
        message: "Random products fetched",
        products,
        total,
        skip: safeSkip,
        take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      console.error("Error fetching random products:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching random products",
        error,
      });
    }
  };

  getAllProducts = async (req: Request, res: Response) => {
    try {
      const { skip, take } = req.pagination!;
      const products = await Product.find()
        .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef")
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Product.countDocuments();
      res.status(200).json({
        data: products,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching all products", error });
    }
  };
}

export default new ProductController();
