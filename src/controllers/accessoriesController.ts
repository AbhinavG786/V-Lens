import { Accessories } from "../models/accessoriesModel";
import { Product } from "../models/productModel";
import express from "express";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import { Inventory } from "../models/inventoryModel";
import { Warehouse } from "../models/warehouseModel";
import mongoose from "mongoose";

class AccessoriesController {
  createAccessories = async (req: express.Request, res: express.Response) => {
    const {
      brand,
      price,
      description,
      name,
      discount = 0,
      tags,
      gender,
      threshold,
      stockByWarehouse,
    } = req.body;

    if (!brand || !price || !description || !stockByWarehouse || !name) {
      res.status(400).json({ message: "Missing required fields" });
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
        "accessories"
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

      const newAccessory = await new Accessories({
        brand,
        price,
        stock: totalStock,
        description,
        discount,
        finalPrice,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
        gender,
      }).save();

      const product = await new Product({
        type: "accessories",
        name,
        tags,
        accessoriesRef: newAccessory._id,
      }).save();

      const warehouses = await Warehouse.find({
        warehouseName: { $in: Object.keys(parsedStock) },
      });

      const warehouseMap = new Map<string, mongoose.Types.ObjectId>();
      warehouses.forEach((w) => warehouseMap.set(w.warehouseName, w._id));

      const inventoryItems = Object.entries(parsedStock).map(
        ([warehouseName, stock]) => ({
          productId: product._id,
          SKU: `ACC-${Date.now().toString(36).toUpperCase()}-${Math.random()
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
        message: "Accessory created with product and inventory",
        accessory: newAccessory,
        product,
        inventory: savedInventory,
      });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  };

  getAllAccessories = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const accessories = await Accessories.find()
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Accessories.countDocuments();
      res.status(200).json({
        data: accessories,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching accessories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAccessoriesById = async (req: express.Request, res: express.Response) => {
    const { accessoriesId } = req.params;
    try {
      const accessories = await Accessories.findById(accessoriesId);
      res.status(200).json(accessories);
    } catch (error) {
      console.error("Error fetching accessories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAccessoriesByBrand = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { brand } = req.query;
    const { skip, take } = req.pagination!;
    try {
      const accessories = await Accessories.find({ brand: brand })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Accessories.countDocuments();
      if (accessories.length === 0) {
        res
          .status(404)
          .json({ message: "No accessories found for this brand" });
        return;
      }
      res.status(200).json({
        data: accessories,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching accessories by brand:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  updateAccessoriesProduct = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { accessoriesId } = req.params;
    const {
      brand,
      price,
      description,
      gender,
      discount,
      productName,
      tags,
      folder = "accessories",
    } = req.body;

    const folderType = req.body.folder || req.query.folder || "accessories";

    try {
      const accessory = await Accessories.findById(accessoriesId);
      if (!accessory) {
        res.status(404).json({ message: "Accessories not found" });
        return;
      }

      const updatedFields: any = {};

      if (brand) updatedFields.brand = brand;
      if (description) updatedFields.description = description;
      
      if (gender) {
        const allowedGenders = (Accessories.schema.path("gender") as any)
        .enumValues;
        if (allowedGenders.includes(gender)) {
          updatedFields.gender = gender;
        } else {
          res.status(400).json({ message: "Invalid gender value." });
          return;
        }
      }
      const newPrice = price !== undefined ? price : accessory.price;
      const newDiscount = discount !== undefined ? discount : accessory.discount;

      updatedFields.price = newPrice;
      updatedFields.discount = newDiscount;

      updatedFields.finalPrice =
        newDiscount > 0
          ? Math.round(newPrice - (newPrice * newDiscount) / 100)
          : newPrice;
      
      // if (price) updatedFields.price = price;
      // if (discount !== undefined) {
      //   updatedFields.discount = discount;
      //   const basePrice = price !== undefined ? price : accessory.price;
      //   updatedFields.finalPrice =
      //     discount > 0
      //       ? Math.round(basePrice - (basePrice * discount) / 100)
      //       : basePrice;
      // }

      if (req.file) {
        if (accessory.imagePublicId) {
          await cloudinary.uploader.destroy(accessory.imagePublicId);
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

          updatedFields.imageUrl = uploaded.secure_url;
          updatedFields.imagePublicId = uploaded.public_id;
        } catch (cloudErr) {
          console.error("Cloudinary upload error:", cloudErr);
          res.status(500).json({ message: "Image upload failed" });
          return;
        }
      }

      Object.assign(accessory, updatedFields);
      const updatedAccessories = await accessory.save();

      if (!updatedAccessories) {
        res.status(404).json({ message: "Updated accessories not found" });
        return;
      }

      const updatedProductData: any = {};
      if (productName) updatedProductData.name = productName;
      if (tags) updatedProductData.tags = tags;

      const updatedProduct = await Product.findOneAndUpdate(
        { accessoriesRef: accessoriesId },
        updatedProductData,
        { new: true }
      );

      if (!updatedProduct) {
        res.status(404).json({ message: "Related product not found" });
        return;
      }

      res.status(200).json({
        message: "Accessories and product updated successfully",
        accessories: updatedAccessories,
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating accessories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteAccessories = async (req: express.Request, res: express.Response) => {
    const { accessoriesId } = req.params;
    try {
      const accessories = await Accessories.findById(accessoriesId);
      if (!accessories) {
        res.status(404).json({ message: "Accessories not found" });
        return;
      }
      if (accessories.imagePublicId) {
        await cloudinary.uploader.destroy(accessories.imagePublicId);
      }
      await accessories.deleteOne();
      const product = await Product.findOne({ accessoriesRef: accessoriesId });
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      await product.deleteOne();
      await Inventory.deleteMany({ productId: product._id });
      res
        .status(204)
        .json({ message: "Accessories and Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting accessories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAccessoriesByFilters = async (req: express.Request, res: express.Response) => {
    const {
      brand,
      gender,
      minPrice,
      maxPrice,
    } = req.query;
    const { skip, take } = req.pagination!;

    try {
      const filters: any = {};
      if (brand) filters.brand = brand;
      if (gender) {
        const allowedGenders = (Accessories.schema.path("gender") as any).enumValues;
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

      const accessories = await Accessories.find(filters);
      if (accessories.length === 0) {
        res
          .status(404)
          .json({ message: "No products found for these filters" });
        return;
      }
      const accessoryIds = accessories.map((l) => l._id);

      const [products, total] = await Promise.all([
        Product.find({ accessoriesRef: { $in: accessoryIds } })
          .skip(Number(skip))
          .limit(Number(take)),
        Product.countDocuments({ accessoriesRef: { $in: accessoryIds } }),
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
      console.error("Error fetching accessory products by filters:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAccessoriesByPriceRange = async (
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
      const accessories = await Accessories.find({
        price: {
          $gte: parseFloat(minPrice as string),
          $lte: parseFloat(maxPrice as string),
        },
      })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Accessories.countDocuments();
      if (accessories.length === 0) {
        res
          .status(404)
          .json({ message: "No accessories found in this price range" });
        return;
      }
      res.status(200).json({
        data: accessories,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching accessories by price range:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default new AccessoriesController();
