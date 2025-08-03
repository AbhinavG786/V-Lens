import { Request, Response } from "express";
import { Frame } from "../models/frameModel";
import { Product } from "../models/productModel";
import { Warehouse } from "../models/warehouseModel";
import { Inventory } from "../models/inventoryModel";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import cloudinary from "../utils/cloudinary";
import mongoose from "mongoose";

class FrameController {
  createFrame = async (req: Request, res: Response) => {
    const {
      brand,
      shape,
      material,
      color,
      size,
      // stock,
      price,
      description,
      name,
      discount,
      tags,
      gender,
      threshold,
      stockByWarehouse,
      folder = "frame",
    } = req.body;

    const folderType = req.body.folder || req.query.folder || "others";

    if (
      !brand ||
      !shape ||
      !material ||
      !color ||
      !size ||
      !stockByWarehouse ||
      !price ||
      !description
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    let parsedStockByWarehouse: Record<string, number> = {};
    try {
      parsedStockByWarehouse = JSON.parse(stockByWarehouse);
    } catch (err) {
      res.status(400).json({ message: "Invalid stockByWarehouse format" });
      return;
    }
    try {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname,
        folderType
      );

      if (!uploaded) {
        res.status(500).json({ message: "Image upload failed" });
        return;
      }

      const totalStock = Object.values(parsedStockByWarehouse).reduce(
        (sum: number, qty) => sum + Number(qty),
        0
      );

      const frame = await Frame.create({
        brand,
        shape,
        material,
        color,
        size,
        stock: totalStock,
        price,
        description,
        discount,
        finalPrice:
          discount > 0 ? Math.round(price - (price * discount) / 100) : price,
        gender,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      });

      const product = await Product.create({
        type: "frames",
        name,
        tags,
        frameRef: frame._id,
      });

      const warehouseNames = Object.keys(parsedStockByWarehouse);

      const warehouses = await Warehouse.find({
        warehouseName: { $in: warehouseNames },
      });

      const warehouseMap = new Map<string, mongoose.Types.ObjectId>();
      warehouses.forEach((w) => warehouseMap.set(w.warehouseName, w._id));

      for (const name of warehouseNames) {
        if (!warehouseMap.has(name)) {
          res.status(404).json({ message: `Warehouse not found: ${name}` });
          return;
        }
      }

      const inventoryItems = warehouseNames.map((warehouseName) => ({
        productId: product._id,
        SKU: `FRA-${Date.now().toString(36).toUpperCase()}-${Math.random()
          .toString(36)
          .substr(2, 5)
          .toUpperCase()}`,
        stock: Number(parsedStockByWarehouse[warehouseName]),
        threshold,
        warehouseId: warehouseMap.get(warehouseName),
      }));

      const savedInventoryItems = await Inventory.insertMany(inventoryItems);

      res.status(201).json({
        message: "Frame, Product and Inventory items created successfully",
        frame: frame,
        product: product,
        inventoryItems: savedInventoryItems,
      });
    } catch (error) {
      console.error("Error creating frame:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // getAllFrames = async (_req: Request, res: Response) => {
  //     try {
  //     const frames = await Frame.find().sort({ createdAt: -1 });
  //     res.status(200).json(frames);
  //     } catch (error) {
  //     res.status(500).json({ message: "Error fetching frames", error });
  //     }
  // };

  getAllFrames = async (req: Request, res: Response) => {
    try {
      const { skip, take } = req.pagination!;
      const frames = await Frame.find()
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(take));

      const total = await Frame.countDocuments();

      res.status(200).json({
        data: frames,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching frames", error });
    }
  };

  getFrameById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const frame = await Frame.findById(id);
      if (!frame) {
        res.status(404).json({ message: "Frame not found" });
        return;
      }
      res.status(200).json(frame);
    } catch (error) {
      res.status(500).json({ message: "Error fetching frame", error });
    }
  };

  updateFrame = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      brand,
      shape,
      material,
      color,
      size,
      //   stock,
      price,
      description,
      productName,
      discount,
      tags,
      gender,
      folder = "frame",
    } = req.body;

    const folderType = req.body.folder || req.query.folder || "others";

    try {
      const frame = await Frame.findById(id);
      if (!frame) {
        res.status(404).json({ message: "Frame not found" });
        return;
      }

      const updatedData: any = {};
      if (brand) updatedData.brand = brand;
      if (shape) updatedData.shape = shape;
      if (material) updatedData.material = material;
      if (color) updatedData.color = color;
      if (size) updatedData.size = size;
      //   if (stock) updatedData.stock = stock;
      if (price) updatedData.price = price;
      if (description) updatedData.description = description;
      if (discount) {
        updatedData.discount = discount;
        updatedData.finalPrice =
          discount > 0
            ? Math.round(frame.price - (frame.price * discount) / 100)
            : frame.price;
      }
      if (gender) {
        const allowedGenders = (Frame.schema.path("gender") as any).enumValues;
        if (!allowedGenders.includes(gender)) {
          res.status(400).json({ message: "Invalid gender value" });
          return;
        }
        updatedData.gender = gender;
      }

      if (req.file) {
        if (frame.imagePublicId) {
          await cloudinary.uploader.destroy(frame.imagePublicId);
        }

        const uploaded = await uploadBufferToCloudinary(
          req.file.buffer,
          req.file.originalname,
          folderType
        );

        if (!uploaded) {
          res.status(500).json({ message: "Image upload failed" });
          return;
        }

        updatedData.imageUrl = uploaded.secure_url;
        updatedData.imagePublicId = uploaded.public_id;
      }

      Object.assign(frame, updatedData);
      const updatedFrame = await frame.save();

      const updatedProductData: any = {};
      if (productName) updatedProductData.name = productName;
      if (tags) updatedProductData.tags = tags;

      const updatedProduct = await Product.findOneAndUpdate(
        { frameRef: id },
        updatedProductData,
        { new: true }
      );

      res.status(200).json({
        message: "Frame updated successfully",
        frame: updatedFrame,
        product: updatedProduct,
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating frame", error });
    }
  };

  deleteFrame = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const frame = await Frame.findById(id);
      if (!frame) {
        res.status(404).json({ message: "Frame not found" });
        return;
      }

      if (frame.imagePublicId) {
        await cloudinary.uploader.destroy(frame.imagePublicId);
      }

      await frame.deleteOne();
      const product = await Product.findOne({ frameRef: id });
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      await product.deleteOne();
      await Inventory.deleteMany({ productId: product._id });
      res
        .status(204)
        .json({ message: "Frame and associated product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting frame", error });
    }
  };
}

export default new FrameController();
