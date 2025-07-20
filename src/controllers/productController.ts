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

  getProductById = async (req: Request, res: Response) => {
    const { productId } = req.params;
    try {
      const product = await Product.findById(productId).populate(
        "lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef"
      );
      if (!product) {
         res.status(404).json({ message: "Product not found" });
         return
      }
      res
        .status(200)
        .json({ message: "Product fetched successfully", product });
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error });
    }
  };

  getAllProductsByType = async (req: Request, res: Response) => {
    const { type } = req.query;
    const { skip, take } = req.pagination!;
    if (type) {
      const allowedTypes = (Product.schema.path("type") as any).enumValues;
      if (!allowedTypes.includes(type)) {
        res.status(400).json({ message: "Invalid product type" });
        return;
      }
    } else {
      res.status(400).json({ message: "Product type is required" });
      return;
    }
    try {
      let populateReference: any = "";
      switch (type) {
        case "lenses":
          populateReference = "lensRef";
          break;
        case "frames":
          populateReference = "frameRef";
          break;
        case "accessories":
          populateReference = "accessoriesRef";
          break;
        case "sunglasses":
          populateReference = "sunglassesRef";
          break;
        case "eyeglasses":
          populateReference = "eyeglassesRef";
          break;
      }

      const products = await Product.find({ type })
        .populate(populateReference)
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Product.countDocuments();
      if (products.length === 0) {
        res.status(404).json({ message: "No products found for this type" });
        return;
      }
      res.status(200).json({
        data: products,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error });
    }
  };

  // getProductsByFinalPriceRange = async (req: Request, res: Response) => {
  //   const { minPrice, maxPrice, type } = req.query;
  //   const { skip, take } = req.pagination!;
  //   if (!minPrice || !maxPrice) {
  //     res
  //       .status(400)
  //       .json({ message: "Both minPrice and maxPrice are required" });
  //     return;
  //   }
  //   if (type) {
  //     const allowedTypes = (Product.schema.path("type") as any).enumValues;
  //     if (!allowedTypes.includes(type)) {
  //       res.status(400).json({ message: "Invalid product type" });
  //       return;
  //     }
  //   } else {
  //     res.status(400).json({ message: "Product type is required" });
  //     return;
  //   }
  //   try {
  //     let populateReference: any = "";
  //     switch (type) {
  //       case "lenses":
  //         populateReference = "lensRef";
  //         break;
  //       case "frames":
  //         populateReference = "frameRef";
  //         break;
  //       case "accessories":
  //         populateReference = "accessoriesRef";
  //         break;
  //       case "sunglasses":
  //         populateReference = "sunglassesRef";
  //         break;
  //       case "eyeglasses":
  //         populateReference = "eyeglassesRef";
  //         break;
  //     }
  //     const products = await Product.find({
  //       type,
  //       finalPrice: {
  //         $gte: parseFloat(minPrice as string),
  //         $lte: parseFloat(maxPrice as string),
  //       },
  //     })
  //       .populate(populateReference)
  //       .skip(Number(skip))
  //       .limit(Number(take));
  //     const total = await Product.countDocuments();
  //     if (products.length === 0) {
  //       res
  //         .status(404)
  //         .json({ message: "No products found in this price range" });
  //       return;
  //     }
  //     res.status(200).json({
  //       data: products,
  //       total,
  //       skip: Number(skip),
  //       take: Number(take),
  //       totalPages: Math.ceil(total / Number(take)),
  //     });
  //   } catch (error) {
  //     console.error("Error fetching products by price range:", error);
  //     res.status(500).json({ message: "Internal server error" });
  //   }
  // };
}

export default new ProductController();
