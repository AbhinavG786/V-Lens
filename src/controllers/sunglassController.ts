import { Request, Response } from "express";
import { Sunglass } from "../models/sunglassModel";
import { Product } from "../models/productModel";
import upload from "../middlewares/upload";
import { uploadBufferToCloudinary } from "../utils/cloudinary";

class SunglassController {
  createSunglass = async (req: Request, res: Response): Promise<void> => {
    try {
      let imageUrl = undefined;
      let imagePublicId = undefined;
      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.body.folder || "sunglasses"
        );
        if (typeof uploaded !== "string") {
          imageUrl = uploaded.secure_url;
          imagePublicId = uploaded.public_id;
        }
      }
      const data = req.body;
      data.finalPrice = data.price - (data.discount || 0);
      if (imageUrl) {
        data.images = [imageUrl];
        data.imagePublicId = imagePublicId;
      }
      const newSunglass = await Sunglass.create(data);
      // Create corresponding Product
      const newProduct = await Product.create({
        type: "sunglasses",
        name: data.name,
        price: data.price,
        discount: data.discount,
        finalPrice: data.finalPrice,
        gender: data.gender,
        sunglassRef: newSunglass._id,
        tags: data.tags || [],
        ratings: { average: 0, count: 0, reviews: [] },
        // Optionally add images to Product as well
        // images: [imageUrl],
      });
      res.status(201).json({ sunglass: newSunglass, product: newProduct });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getAllSunglasses = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: any = {};
      if (req.query.brand) filters.brand = req.query.brand;
      if (req.query.gender) filters.gender = req.query.gender;
      if (req.query.shape) filters.shape = req.query.shape;
      const { skip = 0, take = 10 } = req.pagination || {};
      const sunglasses = await Sunglass.find(filters)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Sunglass.countDocuments(filters);
      res.json({
        data: sunglasses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getSunglassById = async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await Sunglass.findById(req.params.id);
      if (!product) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  updateSunglass = async (req: Request, res: Response): Promise<void> => {
    try {
      let imageUrl = undefined;
      let imagePublicId = undefined;
      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.body.folder || "sunglasses"
        );
        if (typeof uploaded !== "string") {
          imageUrl = uploaded.secure_url;
          imagePublicId = uploaded.public_id;
        }
      }
      const data = req.body;
      if (data.price && data.discount !== undefined) {
        data.finalPrice = data.price - data.discount;
      }
      if (imageUrl) {
        data.images = [imageUrl];
        data.imagePublicId = imagePublicId;
      }
      const updated = await Sunglass.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!updated) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      // Update corresponding Product
      const updatedProduct = await Product.findOneAndUpdate(
        { sunglassRef: req.params.id },
        {
          name: data.name,
          price: data.price,
          discount: data.discount,
          finalPrice: data.finalPrice,
          gender: data.gender,
          tags: data.tags,
          // Optionally update images in Product as well
          // images: [imageUrl],
        },
        { new: true }
      );
      res.json({ sunglass: updated, product: updatedProduct });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteSunglass = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await Sunglass.findByIdAndDelete(req.params.id);
      if (!result) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ message: "Deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default new SunglassController(); 