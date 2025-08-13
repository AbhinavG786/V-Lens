import { EyeglassModel } from "../models/eyeglassModel";
import { Product } from "../models/productModel";
import express from "express";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";
import { Warehouse } from "../models/warehouseModel";
import { Inventory } from "../models/inventoryModel";

class EyeglassController {
  createEyeglass = async (req: express.Request, res: express.Response) => {
    const {
      modelName,
      brand,
      frameType,
      frameShape,
      frameMaterial,
      frameColor,
      frameSize,
      price,
      gender,
      description,
      discount = 0,
      stockByWarehouse,
      threshold,
      tags,
    } = req.body;

    if (
      !modelName ||
      !brand ||
      !frameType ||
      !frameShape ||
      !frameMaterial ||
      !frameColor ||
      !frameSize ||
      !price ||
      !stockByWarehouse ||
      !req.file
    ) {
      res
        .status(400)
        .json({ message: "Missing required fields or image file" });
      return;
    }
    if (gender) {
      const allowedGenders = (EyeglassModel.schema.path("gender") as any)
        .enumValues;
      if (!allowedGenders.includes(gender)) {
        res.status(400).json({ message: "Invalid gender value" });
        return;
      }
    }
    if (frameType) {
      const allowedFrameTypes = (EyeglassModel.schema.path("frameType") as any)
        .enumValues;
      if (!allowedFrameTypes.includes(frameType)) {
        res.status(400).json({ message: "Invalid frameType value" });
        return;
      }
    }
    if (frameShape) {
      const allowedFrameShapes = (
        EyeglassModel.schema.path("frameShape") as any
      ).enumValues;
      if (!allowedFrameShapes.includes(frameShape)) {
        res.status(400).json({ message: "Invalid frameShape value" });
        return;
      }
    }
    if (frameMaterial) {
      const allowedFrameMaterials = (
        EyeglassModel.schema.path("frameMaterial") as any
      ).enumValues;
      if (!allowedFrameMaterials.includes(frameMaterial)) {
        res.status(400).json({ message: "Invalid frameMaterial value" });
        return;
      }
    }

    try {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "eyeglasses"
      );
      if (!uploaded || typeof uploaded === "string") {
        throw new Error("Image upload to Cloudinary failed.");
      }

      const parsedStock: Record<string, number> = JSON.parse(stockByWarehouse);
      const totalStock = Object.values(parsedStock).reduce(
        (sum, val) => sum + Number(val),
        0
      );
      const finalPrice =
        discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

      const eyeglass = new EyeglassModel({
        modelName,
        brand,
        frameType,
        frameShape,
        frameMaterial,
        frameColor,
        frameSize,
        price,
        gender,
        description,
        discount,
        finalPrice,
        stock: totalStock,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      });
      const newEyeglass = await eyeglass.save();

      const product = new Product({
        type: "eyeglasses",
        name: newEyeglass.modelName,
        tags: tags,
        eyeglassesRef: newEyeglass._id,
      });
      const newProduct = await product.save();

      const warehouses = await Warehouse.find({
        warehouseName: { $in: Object.keys(parsedStock) },
      });

      const warehouseMap = new Map(
        warehouses.map((w) => [w.warehouseName, w._id])
      );

      const inventoryItems = Object.entries(parsedStock).map(
        ([warehouseName, stock]) => ({
          productId: newProduct._id,
          SKU: `EYE-${Date.now().toString(36).toUpperCase()}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`,
          stock: Number(stock),
          threshold,
          warehouseId: warehouseMap.get(warehouseName),
        })
      );
      const savedInventory = await Inventory.insertMany(inventoryItems);

      res.status(201).json({
        message:
          "Eyeglass created successfully with product and inventory records.",
        eyeglass: newEyeglass,
        product: newProduct,
        inventory: savedInventory,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res
          .status(400)
          .json({ message: "Validation Error", details: error.message });
        return;
      }
      console.error("Error creating eyeglass:", error);
      res.status(500).json({ message: "Internal server error." });
      return;
    }
  };

  getAllEyeglasses = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const eyeglasses = await EyeglassModel.find()
        .skip(Number(skip))
        .limit(Number(take));
      const total = await EyeglassModel.countDocuments();
      res.status(200).json({
        data: eyeglasses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching eyeglasses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getEyeglassById = async (req: express.Request, res: express.Response) => {
    const { eyeglassId } = req.params;
    try {
      const eyeglass = await EyeglassModel.findById(eyeglassId);
      res.status(200).json(eyeglass);
    } catch (error) {
      console.error("Error fetching eyeglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getEyeglassByBrand = async (req: express.Request, res: express.Response) => {
    const { brand } = req.query;
    const { skip, take } = req.pagination!;
    try {
      const eyeglasses = await EyeglassModel.find({ brand: brand })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await EyeglassModel.countDocuments({ brand: brand });
      if (eyeglasses.length === 0) {
        res.status(404).json({ message: "No eyeglasses found for this brand" });
        return;
      }
      res.status(200).json({
        data: eyeglasses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching eyeglasses by brand:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getEyeglassByFrameType = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { frameType } = req.query;
    const { skip, take } = req.pagination!;
    if (!frameType) {
      res.status(400).json({ message: "Frame type is required" });
      return;
    }

    const allowedFrameTypes = (EyeglassModel.schema.path("frameType") as any)
      .enumValues;
    if (allowedFrameTypes.includes(frameType)) {
      try {
        const eyeglasses = await EyeglassModel.find({ frameType: frameType })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await EyeglassModel.countDocuments({
          frameType: frameType,
        });
        if (eyeglasses.length === 0) {
          res
            .status(404)
            .json({ message: "No eyeglasses found for this frame type" });
          return;
        }
        res.status(200).json({
          data: eyeglasses,
          total,
          skip: Number(skip),
          take: Number(take),
          totalPages: Math.ceil(total / Number(take)),
        });
      } catch (error) {
        console.error("Error fetching eyeglasses by frame type:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    } else {
      res.status(400).json({ message: `Invalid frame type value.` });
      return;
    }
  };

  getEyeglassByFrameShape = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { frameShape } = req.query;
    const { skip, take } = req.pagination!;
    if (!frameShape) {
      res.status(400).json({ message: "Frame shape is required" });
      return;
    }

    const allowedFrameShapes = (EyeglassModel.schema.path("frameShape") as any)
      .enumValues;
    if (allowedFrameShapes.includes(frameShape)) {
      try {
        const eyeglasses = await EyeglassModel.find({ frameShape: frameShape })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await EyeglassModel.countDocuments({
          frameShape: frameShape,
        });
        if (eyeglasses.length === 0) {
          res
            .status(404)
            .json({ message: "No eyeglasses found for this frame shape" });
          return;
        }
        res.status(200).json({
          data: eyeglasses,
          total,
          skip: Number(skip),
          take: Number(take),
          totalPages: Math.ceil(total / Number(take)),
        });
      } catch (error) {
        console.error("Error fetching eyeglasses by frame shape:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    } else {
      res.status(400).json({ message: `Invalid frame shape value.` });
      return;
    }
  };

  getEyeglassByGender = async (req: express.Request, res: express.Response) => {
    const { gender } = req.query;
    const { skip, take } = req.pagination!;
    if (!gender) {
      res.status(400).json({ message: "Gender is required" });
      return;
    }

    const allowedGenders = (EyeglassModel.schema.path("gender") as any)
      .enumValues;
    if (allowedGenders.includes(gender)) {
      try {
        const eyeglasses = await EyeglassModel.find({ gender: gender })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await EyeglassModel.countDocuments({ gender: gender });
        if (eyeglasses.length === 0) {
          res
            .status(404)
            .json({ message: "No eyeglasses found for this gender" });
          return;
        }
        res.status(200).json({
          data: eyeglasses,
          total,
          skip: Number(skip),
          take: Number(take),
          totalPages: Math.ceil(total / Number(take)),
        });
      } catch (error) {
        console.error("Error fetching eyeglasses by gender:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    } else {
      res.status(400).json({ message: `Invalid gender value.` });
      return;
    }
  };

  getEyeglassesByFilters = async (req: express.Request, res: express.Response) => {
    const {
      brand,
      frameType,
      frameShape,
      frameMaterial,
      frameColor,
      frameSize,
      gender,
      minPrice,
      maxPrice,
    } = req.query;
    const { skip, take } = req.pagination!;

    try {
      const filters: any = {};
      if (brand) filters.brand = brand;
      if (frameColor) filters.frameColor = frameColor;
      if (frameSize) filters.frameSize = frameSize;
      if (frameShape) {
        const allowedShapes = (EyeglassModel.schema.path("frameShape") as any).enumValues;
        if (allowedShapes.includes(frameShape)) {
          filters.frameShape = frameShape;
        } else {
          res.status(400).json({ message: `Invalid frameShape value.` });
          return;
        }
      }
      if (frameMaterial) {
        const allowedMaterials = (EyeglassModel.schema.path("frameMaterial") as any).enumValues;
        if (allowedMaterials.includes(frameMaterial)) {
          filters.frameMaterial = frameMaterial;
        } else {
          res.status(400).json({ message: `Invalid frameMaterial value.` });
          return;
        }
      }
      if (frameType) {
        const allowedTypes = (EyeglassModel.schema.path("frameType") as any).enumValues;
        if (allowedTypes.includes(frameType)) {
          filters.frameType = frameType;
        } else {
          res.status(400).json({ message: `Invalid frameType value.` });
          return;
        }
      }
      if (gender) {
        const allowedGenders = (EyeglassModel.schema.path("gender") as any).enumValues;
        if (allowedGenders.includes(gender)) {
          filters.gender = gender;
        } else {
          res.status(400).json({ message: `Invalid gender value.` });
          return;
        }
      }
      if (minPrice || maxPrice) {
        filters.finalPrice = {};
        if (minPrice) filters.finalPrice.$gte = parseFloat(minPrice as string);
        if (maxPrice) filters.finalPrice.$lte = parseFloat(maxPrice as string);
      }

      const eyeglasses = await EyeglassModel.find(filters);
      if (eyeglasses.length === 0) {
        res
          .status(404)
          .json({ message: "No products found for these filters" });
        return;
      }
      const eyeglassIds = eyeglasses.map((l) => l._id);

      const [products, total] = await Promise.all([
        Product.find({ eyeglassesRef: { $in: eyeglassIds } })
          .skip(Number(skip))
          .limit(Number(take))
          .populate("eyeglassesRef"),
        Product.countDocuments({ eyeglassesRef: { $in: eyeglassIds } }),
      ]);

      if (products.length === 0) {
        res
          .status(404)
          .json({ message: "No products found for these filters" });
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
      console.error("Error fetching eyeglass products by filters:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateEyeglassProduct = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { eyeglassId } = req.params;
    const {
      modelName,
      brand,
      frameType,
      frameShape,
      frameMaterial,
      frameColor,
      frameSize,
      gender,
      price,
      description,
      discount,
      tags,
    } = req.body;
    if (!eyeglassId) {
      res.status(400).json({ message: "Eyeglass ID is required" });
      return;
    }

    try {
      const eyeglass = await EyeglassModel.findById(eyeglassId);

      if (!eyeglass) {
        res.status(404).json({ message: "Eyeglass not found" });
        return;
      }

      const updatedFields: any = {};

      if (modelName) updatedFields.modelName = modelName;
      if (brand) updatedFields.brand = brand;
      if (frameType) {
        const allowedFrameTypes = (
          EyeglassModel.schema.path("frameType") as any
        ).enumValues;
        if (allowedFrameTypes.includes(frameType)) {
          updatedFields.frameType = frameType;
        } else {
          res.status(400).json({ message: "Invalid frameType value" });
          return;
        }
      }
      if (frameShape) {
        const allowedFrameShapes = (
          EyeglassModel.schema.path("frameShape") as any
        ).enumValues;
        if (allowedFrameShapes.includes(frameShape)) {
          updatedFields.frameShape = frameShape;
        } else {
          res.status(400).json({ message: "Invalid frameShape value" });
          return;
        }
      }
      if (frameMaterial) {
        const allowedFrameMaterials = (
          EyeglassModel.schema.path("frameMaterial") as any
        ).enumValues;
        if (allowedFrameMaterials.includes(frameMaterial)) {
          updatedFields.frameMaterial = frameMaterial;
        } else {
          res.status(400).json({ message: "Invalid frameMaterial value" });
          return;
        }
      }
      if (frameColor) updatedFields.frameColor = frameColor;
      if (frameSize) updatedFields.frameSize = frameSize;
      if (gender) {
        const allowedGenders = (EyeglassModel.schema.path("gender") as any)
          .enumValues;
        if (allowedGenders.includes(gender)) {
          updatedFields.gender = gender;
        } else {
          res.status(400).json({ message: "Invalid gender value" });
          return;
        }
      }
      // if (price !== undefined) updatedFields.price = price;
      // //if (stock !== undefined) updatedFields.stock = stock;

      // if (discount !== undefined || price !== undefined) {
      //   const basePrice = price !== undefined ? price : eyeglass.price;
      //   const newDiscount =
      //   discount !== undefined ? discount : eyeglass.discount;
      //   updatedFields.discount = newDiscount;
      //   updatedFields.finalPrice =
      //     newDiscount > 0
      //       ? Math.round(basePrice * (1 - newDiscount / 100))
      //       : basePrice;
      //     }
      const newPrice = price !== undefined ? price : eyeglass.price;
      const newDiscount = discount !== undefined ? discount : eyeglass.discount;

      updatedFields.price = newPrice;
      updatedFields.discount = newDiscount;

      updatedFields.finalPrice =
        newDiscount > 0
          ? Math.round(newPrice - (newPrice * newDiscount) / 100)
          : newPrice;
      if (description) updatedFields.description = description;

      if (req.file) {
        if (eyeglass.imagePublicId) {
          await cloudinary.uploader.destroy(eyeglass.imagePublicId);
        }
        const uploaded = await uploadBufferToCloudinary(
          req.file.buffer,
          req.file.originalname,
          "eyeglasses"
        );
        if (!uploaded || typeof uploaded === "string") {
          throw new Error("Image upload to Cloudinary failed.");
        }
        updatedFields.imageUrl = uploaded.secure_url;
        updatedFields.imagePublicId = uploaded.public_id;
      }

      Object.assign(eyeglass, updatedFields);
      const updatedEyeglass = await eyeglass.save();

      const updatedProductData: any = {};
      if (modelName) updatedProductData.name = modelName;
      if (tags) updatedProductData.tags = tags;

      let updatedProduct;
      if (Object.keys(updatedProductData).length > 0) {
        updatedProduct = await Product.findOneAndUpdate(
          { eyeglassesRef: eyeglassId },
          { $set: updatedProductData },
          { new: true }
        );
      } else {
        updatedProduct = await Product.findOne({ eyeglassesRef: eyeglassId });
      }

      res.status(200).json({
        message: "Eyeglass and associated product updated successfully",
        eyeglass: updatedEyeglass,
        product: updatedProduct,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res
          .status(400)
          .json({ message: "Validation failed", details: error.message });
        return;
      }
      console.error("Error updating eyeglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteEyeglass = async (req: express.Request, res: express.Response) => {
    const { eyeglassId } = req.params;
    try {
      const eyeglass = await EyeglassModel.findById(eyeglassId);
      if (!eyeglass) {
        res.status(404).json({ message: "Eyeglass not found" });
        return;
      }
      if (eyeglass.imagePublicId) {
        await cloudinary.uploader.destroy(eyeglass.imagePublicId);
      }
      await eyeglass.deleteOne();
      const product = await Product.findOne({ eyeglassesRef: eyeglassId });
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      if (product.tryOn2DImage?.image_public_id_2D) {
        await cloudinary.uploader.destroy(
          product.tryOn2DImage.image_public_id_2D
        );
      }
      if (product.tryOn3DModel?.objUrl_publicId) {
        await cloudinary.uploader.destroy(product.tryOn3DModel.objUrl_publicId);
      }
      if (product.tryOn3DModel?.mtlUrl_publicId) {
        await cloudinary.uploader.destroy(product.tryOn3DModel.mtlUrl_publicId);
      }
      await product.deleteOne();
      await Inventory.deleteMany({ productId: product._id });
      res
        .status(204)
        .json({ message: "Eyeglass and Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting eyeglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getEyeglassByPriceRange = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { minPrice, maxPrice } = req.query;
    const { skip, take } = req.pagination!;
    if (!minPrice || !maxPrice) {
      res
        .status(400)
        .json({ message: "Both minPrice and maxPrice are required" });
      return;
    }
    try {
      const eyeglasses = await EyeglassModel.find({
        price: {
          $gte: parseFloat(minPrice as string),
          $lte: parseFloat(maxPrice as string),
        },
      })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await EyeglassModel.countDocuments({
        price: {
          $gte: parseFloat(minPrice as string),
          $lte: parseFloat(maxPrice as string),
        },
      });
      if (eyeglasses.length === 0) {
        res
          .status(404)
          .json({ message: "No eyeglasses found in this price range" });
        return;
      }
      res.status(200).json({
        data: eyeglasses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching eyeglasses by price range:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default new EyeglassController();
