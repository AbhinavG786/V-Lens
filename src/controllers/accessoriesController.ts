import { Accessories } from "../models/accessoriesModel";
import { Product } from "../models/productModel";
import express from "express";
import cloudinary from "../utils/cloudinary";
import { uploadBufferToCloudinary } from "../utils/cloudinary";

class AccessoriesController {
  createAccessories = async (req: express.Request, res: express.Response) => {
    const {
      brand,
      price,
      stock,
      description,
      name,
      discount,
      tags,
      gender,
      folder = "accessories",
    } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    if (
      !brand ||
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
      const newAccessories = new Accessories({
        brand,
        price,
        stock,
        description,
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      });
      const savedAccessories = await newAccessories.save();

      const newProduct = new Product({
        type: "accessories",
        name,
        discount,
        finalPrice:
          discount > 0 ? Math.round(price - (price * discount) / 100) : price,
        tags,
        gender,
        accessoriesRef: savedAccessories._id,
      });
      const savedProduct = await newProduct.save();
      res.status(201).json({
        message: "Accessories and Product created successfully",
        accessories: savedAccessories,
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating accessories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllAccessories = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const accessories = await Accessories.find().skip(Number(skip)).limit(Number(take));
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

  getAccessoriesByBrand = async (req: express.Request, res: express.Response) => {
    const { brand } = req.query;
    const { skip, take } = req.pagination!;
    try {
      const accessories = await Accessories.find({ brand: brand })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Accessories.countDocuments();
      if (accessories.length === 0) {
        res.status(404).json({ message: "No accessories found for this brand" });
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

  updateAccessoriesProduct = async (req: express.Request, res: express.Response) => {
    const { accessoriesId } = req.params;
    const {
      brand,
      price,
      stock,
      description,
      productName,
      discount,
      tags,
      folder = "accessories",
    } = req.body;
    const folderType = req.body.folder || req.query.folder || "others";
    try {
      const accessories = await Accessories.findById(accessoriesId);
      if (!accessories) {
        res.status(404).json({ message: "Accessories not found" });
        return;
      }
      const updatedData: any = {};
      if (brand) updatedData.brand = brand;
      if (price) updatedData.price = price;
      if (stock) updatedData.stock = stock;
      if (description) updatedData.description = description;
      if (req.file) {
        if (accessories.imagePublicId) {
          await cloudinary.uploader.destroy(accessories.imagePublicId);
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
      Object.assign(accessories, updatedData);
      const updatedAccessories = await accessories.save();
      if (!updatedAccessories) {
        res.status(404).json({ message: "Updated Accessories not found" });
        return;
      }
      const updatedProductData: any = {};
      if (productName) updatedProductData.name = productName;
      if (discount) {
        updatedProductData.discount = discount;
        updatedProductData.finalPrice =
          discount > 0
            ? Math.round(
                updatedAccessories.price - (updatedAccessories.price * discount) / 100
              )
            : updatedAccessories.price;
      }
      if (tags) updatedProductData.tags = tags;
      const updatedProduct = await Product.findOneAndUpdate(
        { accessoriesRef: accessoriesId },
        updatedProductData,
        { new: true }
      );
      if (!updatedProduct) {
        res.status(404).json({ message: "Updated Product not found" });
        return;
      }

      res
        .status(200)
        .json({
          message: "Accessories updated successfully",
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
      await Product.findOneAndDelete({ accessoriesRef: accessoriesId });
      res
        .status(204)
        .json({ message: "Accessories and Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting accessories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  getAccessoriesByPriceRange = async (req: express.Request, res: express.Response) => {
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
