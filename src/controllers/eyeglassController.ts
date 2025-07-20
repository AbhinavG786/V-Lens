import { EyeglassModel } from "../models/eyeglassModel";
import { Product } from "../models/productModel";
import express from "express";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";

class EyeglassController {
  createEyeglass = async (req: express.Request, res: express.Response) => {
    const {
      modelName,
      brand,
      frameType,
      frameShape,
      frameMaterial,
      frameColor,
      gender,
      price,
      stock,
      description,
      name,
      discount,
      tags,
      folder = "eyeglass",
    } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    
    if (
      !modelName ||
      !brand ||
      !frameType ||
      !frameShape ||
      !frameMaterial ||
      !frameColor ||
      !gender ||
      !price ||
      !stock ||
      !description
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    
    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    try {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname,
        folderType
      );

      if (!uploaded) {
        res.status(500).json({ message: "Failed to upload image" });
        return;
      }
      
      const newEyeglass = new EyeglassModel({
        modelName,
        brand,
        frameType,
        frameShape,
        frameMaterial,
        frameColor,
        gender,
        price,
        stock,
        description,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      });
      const savedEyeglass = await newEyeglass.save();

      const newProduct = new Product({
        type: "eyeglasses",
        name,
        discount,
        finalPrice:
          discount > 0 ? Math.round(price - (price * discount) / 100) : price,
        tags,
        gender,
        eyeglassRef: savedEyeglass._id,
      });
      const savedProduct = await newProduct.save();
      
      res.status(201).json({
        message: "Eyeglass and Product created successfully",
        eyeglass: savedEyeglass,
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating eyeglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllEyeglasses = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const eyeglasses = await EyeglassModel.find().skip(Number(skip)).limit(Number(take));
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

  getEyeglassByFrameType = async (req: express.Request, res: express.Response) => {
    const { frameType } = req.query;
    const { skip, take } = req.pagination!;
    if (!frameType) {
      res.status(400).json({ message: "Frame type is required" });
      return;
    }
    
    const allowedFrameTypes = (EyeglassModel.schema.path("frameType") as any).enumValues;
    if (allowedFrameTypes.includes(frameType)) {
      try {
        const eyeglasses = await EyeglassModel.find({ frameType: frameType })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await EyeglassModel.countDocuments({ frameType: frameType });
        if (eyeglasses.length === 0) {
          res.status(404).json({ message: "No eyeglasses found for this frame type" });
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

  getEyeglassByFrameShape = async (req: express.Request, res: express.Response) => {
    const { frameShape } = req.query;
    const { skip, take } = req.pagination!;
    if (!frameShape) {
      res.status(400).json({ message: "Frame shape is required" });
      return;
    }
    
    const allowedFrameShapes = (EyeglassModel.schema.path("frameShape") as any).enumValues;
    if (allowedFrameShapes.includes(frameShape)) {
      try {
        const eyeglasses = await EyeglassModel.find({ frameShape: frameShape })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await EyeglassModel.countDocuments({ frameShape: frameShape });
        if (eyeglasses.length === 0) {
          res.status(404).json({ message: "No eyeglasses found for this frame shape" });
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
    
    const allowedGenders = (EyeglassModel.schema.path("gender") as any).enumValues;
    if (allowedGenders.includes(gender)) {
      try {
        const eyeglasses = await EyeglassModel.find({ gender: gender })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await EyeglassModel.countDocuments({ gender: gender });
        if (eyeglasses.length === 0) {
          res.status(404).json({ message: "No eyeglasses found for this gender" });
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

  updateEyeglassProduct = async (req: express.Request, res: express.Response) => {
    const { eyeglassId } = req.params;
    const {
      modelName,
      brand,
      frameType,
      frameShape,
      frameMaterial,
      frameColor,
      gender,
      price,
      stock,
      description,
      productName,
      discount,
      tags,
      folder = "eyeglass",
    } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    
    try {
      const eyeglass = await EyeglassModel.findById(eyeglassId);
      if (!eyeglass) {
        res.status(404).json({ message: "Eyeglass not found" });
        return;
      }
      
      const updatedData: any = {};
      if (modelName) updatedData.modelName = modelName;
      if (brand) updatedData.brand = brand;
      if (frameType) {
        const allowedFrameTypes = (EyeglassModel.schema.path("frameType") as any).enumValues;
        if (allowedFrameTypes.includes(frameType)) {
          updatedData.frameType = frameType;
        } else {
          res.status(400).json({ message: `Invalid frame type value.` });
          return;
        }
      }
      if (frameShape) {
        const allowedFrameShapes = (EyeglassModel.schema.path("frameShape") as any).enumValues;
        if (allowedFrameShapes.includes(frameShape)) {
          updatedData.frameShape = frameShape;
        } else {
          res.status(400).json({ message: `Invalid frame shape value.` });
          return;
        }
      }
      if (frameMaterial) {
        const allowedFrameMaterials = (EyeglassModel.schema.path("frameMaterial") as any).enumValues;
        if (allowedFrameMaterials.includes(frameMaterial)) {
          updatedData.frameMaterial = frameMaterial;
        } else {
          res.status(400).json({ message: `Invalid frame material value.` });
          return;
        }
      }
      if (frameColor) updatedData.frameColor = frameColor;
      if (gender) {
        const allowedGenders = (EyeglassModel.schema.path("gender") as any).enumValues;
        if (allowedGenders.includes(gender)) {
          updatedData.gender = gender;
        } else {
          res.status(400).json({ message: `Invalid gender value.` });
          return;
        }
      }
      if (price) updatedData.price = price;
      if (stock) updatedData.stock = stock;
      if (description) updatedData.description = description;
      
      if (req.file) {
        if (eyeglass.imagePublicId) {
          await cloudinary.uploader.destroy(eyeglass.imagePublicId);
        }
        try {
          const uploaded = await uploadBufferToCloudinary(
            req.file.buffer,
            req.file.originalname,
            folderType
          );

          if (!uploaded) {
            res.status(500).json({ message: "Failed to upload image" });
            return;
          }
          const imageUrl = uploaded.secure_url;
          const imagePublicId = uploaded.public_id;
          updatedData.imagePublicId = imagePublicId;
          updatedData.imageUrl = imageUrl;
        } catch (cloudErr) {
          console.error("Cloudinary upload error:", cloudErr);
          res.status(500).json({ message: "Image upload failed" });
          return;
        }
      }
      
      Object.assign(eyeglass, updatedData);
      const updatedEyeglass = await eyeglass.save();
      if (!updatedEyeglass) {
        res.status(404).json({ message: "Updated Eyeglass not found" });
        return;
      }
      
      const updatedProductData: any = {};
      if (productName) updatedProductData.name = productName;
      if (gender) {
        const allowedGenders = (Product.schema.path("gender") as any).enumValues;
        if (allowedGenders.includes(gender)) {
          updatedProductData.gender = gender;
        }
      }
      if (discount) {
        updatedProductData.discount = discount;
        updatedProductData.finalPrice =
          discount > 0
            ? Math.round(
                updatedEyeglass.price - (updatedEyeglass.price * discount) / 100
              )
            : updatedEyeglass.price;
      }
      if (tags) updatedProductData.tags = tags;
      
      const updatedProduct = await Product.findOneAndUpdate(
        { eyeglassRef: eyeglassId },
        updatedProductData,
        { new: true }
      );
      if (!updatedProduct) {
        res.status(404).json({ message: "Updated Product not found" });
        return;
      }

      res.status(200).json({
        message: "Eyeglass updated successfully",
        eyeglass: updatedEyeglass,
        product: updatedProduct,
      });
    } catch (error) {
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
      await Product.findOneAndDelete({ eyeglassRef: eyeglassId });
      res
        .status(204)
        .json({ message: "Eyeglass and Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting eyeglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getEyeglassByPriceRange = async (req: express.Request, res: express.Response) => {
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