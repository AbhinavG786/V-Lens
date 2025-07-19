import { Lens } from "../models/lensModel";
import { Product } from "../models/productModel";
import { Inventory } from "../models/inventoryModel";
import { Warehouse } from "../models/warehouseModel";
import express from "express";
import mongoose from "mongoose";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";

class LensController {
  createLens = async (req: express.Request, res: express.Response) => {
    const {
      brand,
      type,
      price,
      // stock,
      description,
      color,
      power,
      name,
      discount,
      tags,
      gender,
      threshold,
      stockByWarehouse,
      folder = "lens",
    } = req.body;
    /* stockByWarehouse should be sent as a json object containing warehousename and quantity 
      "stockByWarehouse": {
        "Warehouse A": 20,
        "Warehouse B": 10
      } */
    const folderType = req.body.folder || req.query.folder || "others";
    if (
      !brand ||
      !type ||
      !price ||
      !description ||
      !color ||
      !power ||
      !stockByWarehouse
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

      const totalStock = Object.values(stockByWarehouse).reduce(
        (sum: number, qty) => sum + Number(qty),
        0
      );
      const newLens = new Lens({
        brand,
        type,
        price,
        stock: totalStock,
        description,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
        color,
        power,
      });
      const savedLens = await newLens.save();

      const newProduct = new Product({
        type: "lenses",
        name,
        discount,
        finalPrice:
          discount > 0 ? Math.round(price - (price * discount) / 100) : price,
        tags,
        gender,
        lensRef: savedLens._id,
      });
      const savedProduct = await newProduct.save();

      let parsedStockByWarehouse: Record<string, number> = {};
      try {
        parsedStockByWarehouse = JSON.parse(stockByWarehouse);
      } catch (err) {
        res.status(400).json({ message: "Invalid stockByWarehouse format" });
        return;
      }

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
        productId: savedProduct._id,
        SKU: `LEN-${Date.now().toString(36).toUpperCase()}-${Math.random()
          .toString(36)
          .substr(2, 5)
          .toUpperCase()}`,
        stock: Number(parsedStockByWarehouse[warehouseName]),
        threshold,
        warehouseId: warehouseMap.get(warehouseName),
      }));

      const savedInventoryItems = await Inventory.insertMany(inventoryItems);

      res.status(201).json({
        message: "Lens, Product and Inventory items created successfully",
        lens: savedLens,
        product: savedProduct,
        inventoryItems: savedInventoryItems,
      });
    } catch (error) {
      console.error("Error creating lens:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllLens = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const lenses = await Lens.find().skip(Number(skip)).limit(Number(take));
      const total = await Lens.countDocuments();
      res.status(200).json({
        data: lenses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching lenses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getLensById = async (req: express.Request, res: express.Response) => {
    const { lensId } = req.params;
    try {
      const lens = await Lens.findById(lensId);
      res.status(200).json(lens);
    } catch (error) {
      console.error("Error fetching lenses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getLensByBrand = async (req: express.Request, res: express.Response) => {
    const { brand } = req.query;
    const { skip, take } = req.pagination!;
    try {
      const lenses = await Lens.find({ brand: brand })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Lens.countDocuments();
      if (lenses.length === 0) {
        res.status(404).json({ message: "No lenses found for this brand" });
        return;
      }
      res.status(200).json({
        data: lenses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching lenses by brand:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getLensByType = async (req: express.Request, res: express.Response) => {
    const { type } = req.query;
    const { skip, take } = req.pagination!;
    if (!type) {
      res.status(400).json({ message: "Type is required" });
      return;
    }
    if (type) {
      const allowedTypes = (Lens.schema.path("type") as any).enumValues;
      if (allowedTypes.includes(type)) {
        try {
          const lenses = await Lens.find({ type: type })
            .skip(Number(skip))
            .limit(Number(take));
          const total = await Lens.countDocuments();
          if (lenses.length === 0) {
            res.status(404).json({ message: "No lenses found for this type" });
            return;
          }
          res.status(200).json({
            data: lenses,
            total,
            skip: Number(skip),
            take: Number(take),
            totalPages: Math.ceil(total / Number(take)),
          });
        } catch (error) {
          console.error("Error fetching lenses by type:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      } else {
        res.status(400).json({ message: `Invalid type value.` });
        return;
      }
    }
  };

  updateLensProduct = async (req: express.Request, res: express.Response) => {
    const { lensId } = req.params;
    const {
      brand,
      type,
      price,
      stock,
      description,
      color,
      power,
      productName,
      gender,
      discount,
      tags,
      folder = "lens",
    } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    try {
      const lens = await Lens.findById(lensId);
      if (!lens) {
        res.status(404).json({ message: "Lens not found" });
        return;
      }
      const updatedData: any = {};
      if (brand) updatedData.brand = brand;
      if (type) {
        const allowedTypes = (Lens.schema.path("type") as any).enumValues;
        if (allowedTypes.includes(type)) {
          updatedData.type = type;
        } else {
          res.status(400).json({ message: `Invalid type value.` });
          return;
        }
      }
      if (price) updatedData.price = price;
      if (stock) updatedData.stock = stock;
      if (description) updatedData.description = description;
      if (color) updatedData.color = color;
      if (power) updatedData.power = power;
      if (req.file) {
        if (lens.imagePublicId) {
          await cloudinary.uploader.destroy(lens.imagePublicId);
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
      Object.assign(lens, updatedData);
      const updatedLens = await lens.save();
      if (!updatedLens) {
        res.status(404).json({ message: "Updated Lens not found" });
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
                updatedLens.price - (updatedLens.price * discount) / 100
              )
            : updatedLens.price;
      }
      if (tags) updatedProductData.tags = tags;
      const updatedProduct = await Product.findOneAndUpdate(
        { lensRef: lensId },
        updatedProductData,
        { new: true }
      );
      if (!updatedProduct) {
        res.status(404).json({ message: "Updated Product not found" });
        return;
      }

      res.status(200).json({
        message: "Lens updated successfully",
        lens: updatedLens,
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating lens:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteLens = async (req: express.Request, res: express.Response) => {
    const { lensId } = req.params;
    try {
      const lens = await Lens.findById(lensId);
      if (!lens) {
        res.status(404).json({ message: "Lens not found" });
        return;
      }
      if (lens.imagePublicId) {
        await cloudinary.uploader.destroy(lens.imagePublicId);
      }
      await lens.deleteOne();
      await Product.findOneAndDelete({ lensRef: lensId });
      res
        .status(204)
        .json({ message: "Lens and Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting lens:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getLensByPriceRange = async (req: express.Request, res: express.Response) => {
    const { minPrice, maxPrice } = req.query;
    const { skip, take } = req.pagination!;
    if (!minPrice || !maxPrice) {
      res
        .status(400)
        .json({ message: "Both minPrice and maxPrice are required" });
      return;
    }
    try {
      const lenses = await Lens.find({
        price: {
          $gte: parseFloat(minPrice as string),
          $lte: parseFloat(maxPrice as string),
        },
      })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Lens.countDocuments();
      if (lenses.length === 0) {
        res
          .status(404)
          .json({ message: "No lenses found in this price range" });
        return;
      }
      res.status(200).json({
        data: lenses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching lenses by price range:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default new LensController();
