import { Sunglass } from "../models/sunglassModel";
import { Product } from "../models/productModel";
import express from "express";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import { Inventory } from "../models/inventoryModel";
import { Warehouse } from "../models/warehouseModel";
import mongoose from "mongoose";

class SunglassController {
  createSunglass = async (req: express.Request, res: express.Response) => {
    const {
      name,
      brand,
      material,
      lensShape,
      description,
      price,
      frameType,
      size,
      color,
      gender,
      discount = 0,
      threshold,
      stockByWarehouse,
      tags,
    } = req.body;

    if (
      !name ||
      !brand ||
      !description ||
      !material ||
      !lensShape ||
      !price ||
      !frameType ||
      !size ||
      !color ||
      !stockByWarehouse
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }
    if (gender) {
          const allowedGenders = (Sunglass.schema.path("gender") as any).enumValues;
          if (!allowedGenders.includes(gender)) {
            res.status(400).json({ message: "Invalid gender value" });
            return;
          }
        }
        if(frameType){
          const allowedFrameTypes = (Sunglass.schema.path("frameType") as any).enumValues;
          if (!allowedFrameTypes.includes(frameType)) {
            res.status(400).json({ message: "Invalid frameType value" });
            return;
          }
        }

    try {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "sunglasses"
      );

      if (!uploaded || typeof uploaded === "string") {
        res.status(500).json({ message: "Image upload failed" });
        return;
      }

      const parsedStock: Record<string, number> = JSON.parse(stockByWarehouse);
      const totalStock = Object.values(parsedStock).reduce(
        (sum, val) => sum + Number(val),
        0
      );

      const finalPrice =
        discount > 0 ? Math.round(price - (price * discount) / 100) : price;

      const newSunglass = await new Sunglass({
        name,
        brand,
        price,
        frameType,
        size,
        lensShape,
        material,
        description,
        color,
        gender,
        discount,
        finalPrice,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
        stock: totalStock,
      }).save();

      const product = await new Product({
        type: "sunglasses",
        name,
        tags,
        sunglassesRef: newSunglass._id,
      }).save();

      const warehouses = await Warehouse.find({
        warehouseName: { $in: Object.keys(parsedStock) },
      });

      const warehouseMap = new Map<string, mongoose.Types.ObjectId>();
      warehouses.forEach((w) => warehouseMap.set(w.warehouseName, w._id));

      const inventoryItems = Object.entries(parsedStock).map(
        ([warehouseName, stock]) => ({
          productId: product._id,
          SKU: `SUN-${Date.now().toString(36).toUpperCase()}-${Math.random()
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
        message: "Sunglass created with product and inventory",
        sunglass: newSunglass,
        product,
        inventory: savedInventory,
      });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
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
      name,
      brand,
      frameType,
      lensShape,
      material,
      price,
      color,
      description,
      discount,
      gender,
      size,
      tags,
    } = req.body;

    try {
      const sunglass = await Sunglass.findById(sunglassId);
      if (!sunglass) {
        res.status(404).json({ message: "Sunglass not found" });
        return;
      }

      const updatedFields: any = {};
      if (brand) updatedFields.brand = brand;
      if (frameType) updatedFields.frameType = frameType;
      if (lensShape) updatedFields.lensShape = lensShape;
      if (material) updatedFields.material = material;
      if (color) updatedFields.color = color;
      if (description) updatedFields.description = description;
      if (gender) updatedFields.gender = gender;
      if (size) updatedFields.size = size;
      const newPrice = price !== undefined ? price : sunglass.price;
      const newDiscount = discount !== undefined ? discount : sunglass.discount;

updatedFields.price = newPrice;
updatedFields.discount = newDiscount;

updatedFields.finalPrice =
  newDiscount > 0
    ? Math.round(newPrice - (newPrice * newDiscount) / 100)
    : newPrice;
      
      // if (price) updatedFields.price = price;
      // if (discount !== undefined || price !== undefined) {
      //   const basePrice = price !== undefined ? price : sunglass.price;
      //   const newDiscount =
      //     discount !== undefined ? discount : sunglass.discount;
      //   updatedFields.discount = newDiscount;
      //   updatedFields.finalPrice =
      //     newDiscount > 0
      //       ? Math.round(basePrice - (basePrice * newDiscount) / 100)
      //       : basePrice;
      // }

      if (req.file) {
        if (sunglass.imagePublicId) {
          await cloudinary.uploader.destroy(sunglass.imagePublicId);
        }

        const uploaded = await uploadBufferToCloudinary(
          req.file.buffer,
          req.file.originalname,
          "sunglasses"
        );

        if (!uploaded || typeof uploaded === "string") {
          res.status(500).json({ message: "New image upload failed" });
          return;
        }
        updatedFields.imageUrl = uploaded.secure_url;
        updatedFields.imagePublicId = uploaded.public_id;
      }

      Object.assign(sunglass, updatedFields);
      const updatedSunglass = await sunglass.save();

      const updatedProductData: any = {};
      if (name) updatedProductData.name = name;
      if (tags) updatedProductData.tags = tags;

      let updatedProduct;
      if (Object.keys(updatedProductData).length > 0) {
        updatedProduct = await Product.findOneAndUpdate(
          { sunglassesRef: sunglassId },
          { $set: updatedProductData },
          { new: true }
        );
      } else {
        updatedProduct = await Product.findOne({ sunglassesRef: sunglassId });
      }

      res.status(200).json({
        message: "Sunglass and associated product updated successfully",
        sunglass: updatedSunglass,
        product: updatedProduct,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res
          .status(400)
          .json({ message: "Validation Error", details: error.message });
        return;
      }
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
      const product = await Product.findOne({ sunglassesRef: sunglassId });
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

  getSunglassesByFilters = async (req: express.Request, res: express.Response) => {
      const {
        brand,
        frameType,
        lensShape,
        material,
        color,
        size,
        gender,
        minPrice,
        maxPrice,
      } = req.query;
      const { skip, take } = req.pagination!;
  
      try {
        const filters: any = {};
        if (brand) filters.brand = brand;
        if (color) filters.color = color;
        if (material) filters.material = material;
        if (size) {
          const allowedSizes = (Sunglass.schema.path("size") as any).enumValues;
          if (allowedSizes.includes(size)) {
            filters.size = size;
          } else {
            res.status(400).json({ message: `Invalid size value.` });
            return;
          }
        }
        if (lensShape) {
          const allowedShapes = (Sunglass.schema.path("lensShape") as any).enumValues;
          if (allowedShapes.includes(lensShape)) {
            filters.lensShape = lensShape;
          } else {
            res.status(400).json({ message: `Invalid lensShape value.` });
            return;
          }
        }
        if (frameType) {
          const allowedTypes = (Sunglass.schema.path("frameType") as any).enumValues;
          if (allowedTypes.includes(frameType)) {
            filters.frameType = frameType;
          } else {
            res.status(400).json({ message: `Invalid frameType value.` });
            return;
          }
        }
        if (gender) {
          const allowedGenders = (Sunglass.schema.path("gender") as any).enumValues;
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

        const sunglasses = await Sunglass.find(filters);
        if (sunglasses.length === 0) {
          res
            .status(404)
            .json({ message: "No products found for these filters" });
          return;
        }
        const sunglassIds = sunglasses.map((l) => l._id);

        const [products, total] = await Promise.all([
          Product.find({ sunglassesRef: { $in: sunglassIds } })
            .skip(Number(skip))
            .limit(Number(take)),
          Product.countDocuments({ sunglassesRef: { $in: sunglassIds } }),
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
        console.error("Error fetching sunglass products by filters:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    };
  
}

export default new SunglassController();
