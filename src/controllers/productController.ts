import { Product } from "../models/productModel";
import { Request, Response } from "express";
import express from "express";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
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
        .populate(
          "lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef"
        );

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
        .populate(
          "lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef"
        );

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
        return;
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

  upload2dTryOnImage = async (req: Request, res: Response) => {
    const { productId } = req.params;
    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }
    try {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      let folderType = "";
      if (!product.type) {
        res.status(400).json({ message: "Product type is required" });
        return;
      }
      if (product.type === "eyeglasses") {
        folderType = "2d-try-on/eyeglasses";
      } else if (product.type === "sunglasses") {
        folderType = "2d-try-on/sunglasses";
      } else {
        folderType = "2d-try-on/others";
      }
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname,
        folderType
      );
      if (!uploaded) {
        res.status(500).json({ message: "Failed to upload image" });
        return;
      }
      if (product.tryOn2DImage && product.tryOn2DImage.image_public_id_2D) {
        await cloudinary.uploader.destroy(
          product.tryOn2DImage.image_public_id_2D
        );
      }
      product.tryOn2DImage = {
        image_url_2D: uploaded.secure_url,
        image_public_id_2D: uploaded.public_id,
      };
      await product.save();
      res.status(200).json({
        message: "2D try-on image uploaded successfully",
        imageUrl: product.tryOn2DImage.image_url_2D,
        imagePublicId: product.tryOn2DImage.image_public_id_2D,
      });
    } catch (error) {
      console.error("Error uploading 2D try-on image:", error);
      res.status(500).json({ message: "Internal server error", error });
      return;
    }
  };

  upload3dTryOnFiles = async (req: Request, res: Response) => {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    if (!req.files || !Array.isArray(req.files)) {
      res.status(400).json({ message: "3D files are required" });
      return;
    }

    const objFile = req.files.find((file: any) =>
      file.originalname.endsWith(".obj")
    );
    const mtlFile = req.files.find((file: any) =>
      file.originalname.endsWith(".mtl")
    );

    if (!objFile || !mtlFile) {
      res
        .status(400)
        .json({ message: ".obj and .mtl files are both required" });
      return;
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      if (!product.type) {
        res.status(400).json({ message: "Product type is required" });
        return;
      }

      let folderType = "";
      if (product.type === "eyeglasses") {
        folderType = "3d-try-on/eyeglasses";
      } else if (product.type === "sunglasses") {
        folderType = "3d-try-on/sunglasses";
      } else {
        folderType = "3d-try-on/others";
      }

      if (product.tryOn3DModel?.objUrl_publicId) {
        await cloudinary.uploader.destroy(product.tryOn3DModel.objUrl_publicId);
      }
      if (product.tryOn3DModel?.mtlUrl_publicId) {
        await cloudinary.uploader.destroy(product.tryOn3DModel.mtlUrl_publicId);
      }

      const [uploadedObj, uploadedMtl] = await Promise.all([
        uploadBufferToCloudinary(
          objFile.buffer,
          objFile.originalname,
          folderType
        ),
        uploadBufferToCloudinary(
          mtlFile.buffer,
          mtlFile.originalname,
          folderType
        ),
      ]);

      if (!uploadedObj || !uploadedMtl) {
        res.status(500).json({ message: "Failed to upload 3D files" });
        return;
      }

      product.tryOn3DModel = {
        objUrl: uploadedObj.secure_url,
        objUrl_publicId: uploadedObj.public_id,
        mtlUrl: uploadedMtl.secure_url,
        mtlUrl_publicId: uploadedMtl.public_id,
      };

      await product.save();

      res.status(200).json({
        message: "3D try-on files uploaded successfully",
        model: product.tryOn3DModel,
      });
    } catch (error) {
      console.error("Error uploading 3D try-on files:", error);
      res.status(500).json({ message: "Internal server error", error });
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
