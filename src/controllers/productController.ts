import { Product } from "../models/productModel";
import { Request, Response } from "express";
import express from "express";
import { SortOrder } from "mongoose";

class ProductController {
  getTrendingProducts = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || "combined";

      let sortOption: Record<string, number>;

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

      const trending = await Product.find()
        .sort({ "ratings.count": -1 } as Record<string, SortOrder>)
        .limit(limit)
        .populate("ratings.reviews")
        .populate(
          "lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef"
        );

      res.status(200).json({
        success: true,
        message: "Trending products fetched successfully",
        products: trending,
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
      const limit = parseInt(req.query.limit as string) || 10;

      const count = await Product.countDocuments();
      const random = Math.max(
        0,
        Math.floor(Math.random() * Math.max(1, count - limit))
      );

      const products = await Product.find()
        .skip(random)
        .limit(limit)
        .populate(
          "lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef"
        );

      res.status(200).json({ message: "Random products fetched", products });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching random products", error });
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
