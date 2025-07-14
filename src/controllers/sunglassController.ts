import { Sunglass } from "../models/sunglassModel";
import { Product } from "../models/productModel";
import express from "express";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";

class SunglassController {
  createSunglass = async (req: express.Request, res: express.Response) => {
    const {
      brand,
      frameType,
      lensShape,
      material,
      price,
      stock,
      description,
      color,
      size,
      name,
      discount,
      tags,
      gender,
      folder = "sunglasses",
    } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    if (
      !brand ||
      !frameType ||
      !price ||
      !stock ||
      !description ||
      !color ||
      !size ||
      !lensShape ||
      !material
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const allowedFrameTypes = (Sunglass.schema.path("frameType") as any)
      .enumValues;
    if (!allowedFrameTypes.includes(frameType)) {
      res.status(400).json({ message: `Invalid frame type value.` });
      return;
    }
    const allowedLensShapes = (Sunglass.schema.path("lensShape") as any)
      .enumValues;
    if (!allowedLensShapes.includes(lensShape)) {
      res.status(400).json({ message: `Invalid lens shape value.` });
      return;
    }
    const allowedSizes = (Sunglass.schema.path("size") as any).enumValues;
    if (!allowedSizes.includes(size)) {
      res.status(400).json({ message: `Invalid size value.` });
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
      const newSunglass = new Sunglass({
        brand,
        frameType,
        lensShape,
        material,
        price,
        stock,
        description,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
        color,
        size,
      });
      const savedSunglass = await newSunglass.save();

      const newProduct = new Product({
        type: "sunglasses",
        name,
        discount,
        finalPrice:
          discount > 0 ? Math.round(price - (price * discount) / 100) : price,
        tags,
        gender,
        sunglassesRef: savedSunglass._id,
      });
      const savedProduct = await newProduct.save();
      res.status(201).json({
        message: "Sunglass and Product created successfully",
        sunglass: savedSunglass,
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating sunglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllSunglasses = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const sunglasses = await Sunglass.find()
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Sunglass.countDocuments();
      res.status(200).json({
        data: sunglasses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching sunglasses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSunglassById = async (req: express.Request, res: express.Response) => {
    const { sunglassId } = req.params;
    try {
      const sunglass = await Sunglass.findById(sunglassId);
      res.status(200).json(sunglass);
    } catch (error) {
      console.error("Error fetching sunglasses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSunglassesByBrand = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { brand } = req.query;
    const { skip, take } = req.pagination!;
    try {
      const sunglasses = await Sunglass.find({ brand: brand })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Sunglass.countDocuments();
      if (sunglasses.length === 0) {
        res.status(404).json({ message: "No sunglasses found for this brand" });
        return;
      }
      res.status(200).json({
        data: sunglasses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching sunglasses by brand:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSunglassesByFrameType = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { frameType } = req.query;
    const { skip, take } = req.pagination!;
    if (!frameType) {
      res.status(400).json({ message: "Type is required" });
      return;
    }
    if (frameType) {
      const allowedTypes = (Sunglass.schema.path("frameType") as any)
        .enumValues;
      if (allowedTypes.includes(frameType)) {
        try {
          const sunglasses = await Sunglass.find({ frameType: frameType })
            .skip(Number(skip))
            .limit(Number(take));
          const total = await Sunglass.countDocuments();
          if (sunglasses.length === 0) {
            res
              .status(404)
              .json({ message: "No sunglasses found for this frame type" });
            return;
          }
          res.status(200).json({
            data: sunglasses,
            total,
            skip: Number(skip),
            take: Number(take),
            totalPages: Math.ceil(total / Number(take)),
          });
        } catch (error) {
          console.error("Error fetching sunglasses by frame type:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      } else {
        res.status(400).json({ message: `Invalid type value.` });
        return;
      }
    }
  };

  updateSunglassProduct = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { sunglassId } = req.params;
    const {
      brand,
      frameType,
      lensShape,
      material,
      price,
      stock,
      description,
      color,
      size,
      productName,
      gender,
      discount,
      tags,
      folder = "sunglasses",
    } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    try {
      const sunglass = await Sunglass.findById(sunglassId);
      if (!sunglass) {
        res.status(404).json({ message: "Sunglass not found" });
        return;
      }
      const updatedData: any = {};
      if (brand) updatedData.brand = brand;
      if (frameType) {
        const allowedTypes = (Sunglass.schema.path("frameType") as any)
          .enumValues;
        if (allowedTypes.includes(frameType)) {
          updatedData.frameType = frameType;
        } else {
          res.status(400).json({ message: `Invalid type value.` });
          return;
        }
      }
      if (lensShape) {
        const allowedTypes = (Sunglass.schema.path("lensShape") as any)
          .enumValues;
        if (allowedTypes.includes(lensShape)) {
          updatedData.lensShape = lensShape;
        } else {
          res.status(400).json({ message: `Invalid shape value.` });
          return;
        }
      }
      if (size) {
        const allowedTypes = (Sunglass.schema.path("size") as any).enumValues;
        if (allowedTypes.includes(size)) {
          updatedData.size = size;
        } else {
          res.status(400).json({ message: `Invalid size value.` });
          return;
        }
      }
      if (price) updatedData.price = price;
      if (stock) updatedData.stock = stock;
      if (description) updatedData.description = description;
      if (color) updatedData.color = color;
      if (material) updatedData.material = material;
      if (req.file) {
        if (sunglass.imagePublicId) {
          await cloudinary.uploader.destroy(sunglass.imagePublicId);
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
      Object.assign(sunglass, updatedData);
      const updatedSunglass = await sunglass.save();
      if (!updatedSunglass) {
        res.status(404).json({ message: "Updated Sunglass not found" });
        return;
      }
      const updatedProductData: any = {};
      if (productName) updatedProductData.name = productName;
      if (gender) {
        const allowedGenders = (Product.schema.path("gender") as any)
          .enumValues;
        if (allowedGenders.includes(gender)) {
          updatedProductData.gender = gender;
        }
      }
      if (discount) {
        updatedProductData.discount = discount;
        updatedProductData.finalPrice =
          discount > 0
            ? Math.round(
                updatedSunglass.price - (updatedSunglass.price * discount) / 100
              )
            : updatedSunglass.price;
      }
      if (tags) updatedProductData.tags = tags;
      const updatedProduct = await Product.findOneAndUpdate(
        { sunglassesRef: sunglassId },
        updatedProductData,
        { new: true }
      );
      if (!updatedProduct) {
        res.status(404).json({ message: "Updated Product not found" });
        return;
      }

      res.status(200).json({
        message: "Sunglass updated successfully",
        sunglass: updatedSunglass,
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating sunglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteSunglass = async (req: express.Request, res: express.Response) => {
    const { sunglassId } = req.params;
    try {
      const sunglass = await Sunglass.findById(sunglassId);
      if (!sunglass) {
        res.status(404).json({ message: "Sunglass not found" });
        return;
      }
      if (sunglass.imagePublicId) {
        await cloudinary.uploader.destroy(sunglass.imagePublicId);
      }
      await sunglass.deleteOne();
      await Product.findOneAndDelete({ sunglassesRef: sunglassId });
      res
        .status(204)
        .json({ message: "Sunglass and Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting Sunglass:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSunglassesByPriceRange = async (
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
      const sunglasses = await Sunglass.find({
        price: {
          $gte: parseFloat(minPrice as string),
          $lte: parseFloat(maxPrice as string),
        },
      })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Sunglass.countDocuments();
      if (sunglasses.length === 0) {
        res
          .status(404)
          .json({ message: "No sunglasses found in this price range" });
        return;
      }
      res.status(200).json({
        data: sunglasses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching sunglasses by price range:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSunglassesByLensShape = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { lensShape } = req.query;
    const { skip, take } = req.pagination!;
    if (!lensShape) {
      res.status(400).json({ message: "Lens shape is required" });
      return;
    }
    try {
      const allowedShapes = (Sunglass.schema.path("lensShape") as any)
        .enumValues;
      if (allowedShapes.includes(lensShape)) {
        const sunglasses = await Sunglass.find({ lensShape: lensShape })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await Sunglass.countDocuments();
        if (sunglasses.length === 0) {
          res
            .status(404)
            .json({ message: "No sunglasses found for this lens shape" });
          return;
        }
        res.status(200).json({
          data: sunglasses,
          total,
          skip: Number(skip),
          take: Number(take),
          totalPages: Math.ceil(total / Number(take)),
        });
      } else {
        res.status(400).json({ message: `Invalid lens shape value.` });
        return;
      }
    } catch (error) {
      console.error("Error fetching sunglasses by lens shape:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getSunglassesBySize = async (req: express.Request, res: express.Response) => {
    const { size } = req.query;
    const { skip, take } = req.pagination!;
    if (!size) {
      res.status(400).json({ message: "Size is required" });
      return;
    }
    try {
      const allowedSizes = (Sunglass.schema.path("size") as any).enumValues;
      if (allowedSizes.includes(size)) {
        const sunglasses = await Sunglass.find({ size: size })
          .skip(Number(skip))
          .limit(Number(take));
        const total = await Sunglass.countDocuments();
        if (sunglasses.length === 0) {
          res
            .status(404)
            .json({ message: "No sunglasses found for this size" });
          return;
        }
        res.status(200).json({
          data: sunglasses,
          total,
          skip: Number(skip),
          take: Number(take),
          totalPages: Math.ceil(total / Number(take)),
        });
      } else {
        res.status(400).json({ message: `Invalid size value.` });
        return;
      }
    } catch (error) {
      console.error("Error fetching sunglasses by size:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default new SunglassController();
