import { Request, Response } from "express";
import { Sunglass } from "../models/sunglassModel";
import { Product } from "../models/productModel";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import cloudinary from "../utils/cloudinary";
import upload from "../middlewares/upload";

class SunglassController {
    createSunglass = async (req: Request, res: Response) => {
        const {
            brand,
            frameType,
            lensShape,
            material,
            price,
            color,
            stock,
            description,
            size,
            name,
            discount,
            tags,
            gender,
            folder = "sunglass",
        } = req.body;
        const folderType = req.body.folder || req.query.folder || "others";
        if (!brand || !frameType || !lensShape || !material || !price || !color || !stock || !description || !size) {
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
                folderType
            );
            if (!uploaded) {
                res.status(500).json({ message: "Image upload failed" });
                return;
            }
            const sunglass = await Sunglass.create({
                brand,
                frameType,
                lensShape,
                material,
                price,
                color,
                stock,
                description,
                size,
                imageUrl: uploaded.secure_url,
                imagePublicId: uploaded.public_id,
            });
            const product = await Product.create({
                type: "sunglasses",
                name,
                discount,
                finalPrice: discount > 0 ? Math.round(price - (price * discount) / 100) : price,
                tags,
                gender,
                sunglassRef: sunglass._id,
            });
            res.status(201).json({
                message: "Sunglass and Product created successfully",
                sunglass,
                product,
            });
        } catch (error) {
            console.error("Error creating sunglass:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    getAllSunglasses = async (_req: Request, res: Response) => {
        try {
            const sunglasses = await Sunglass.find().sort({ createdAt: -1 });
            res.status(200).json(sunglasses);
        } catch (error) {
            res.status(500).json({ message: "Error fetching sunglasses", error });
        }
    };

    getSunglassById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const sunglass = await Sunglass.findById(id);
            if (!sunglass) {
                res.status(404).json({ message: "Sunglass not found" });
                return;
            }
            res.status(200).json(sunglass);
        } catch (error) {
            res.status(500).json({ message: "Error fetching sunglass", error });
        }
    };

    updateSunglass = async (req: Request, res: Response) => {
        const { id } = req.params;
        const {
            brand,
            frameType,
            lensShape,
            material,
            price,
            color,
            stock,
            description,
            size,
            productName,
            discount,
            tags,
            gender,
            folder = "sunglass",
        } = req.body;
        const folderType = req.body.folder || req.query.folder || "others";
        try {
            const sunglass = await Sunglass.findById(id);
            if (!sunglass) {
                res.status(404).json({ message: "Sunglass not found" });
                return;
            }
            const updatedData: any = {};
            if (brand) updatedData.brand = brand;
            if (frameType) updatedData.frameType = frameType;
            if (lensShape) updatedData.lensShape = lensShape;
            if (material) updatedData.material = material;
            if (price) updatedData.price = price;
            if (color) updatedData.color = color;
            if (stock) updatedData.stock = stock;
            if (description) updatedData.description = description;
            if (size) updatedData.size = size;
            if (req.file) {
                if (sunglass.imagePublicId) {
                    await cloudinary.uploader.destroy(sunglass.imagePublicId);
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
            Object.assign(sunglass, updatedData);
            const updatedSunglass = await sunglass.save();
            const updatedProductData: any = {};
            if (productName) updatedProductData.name = productName;
            if (discount) {
                updatedProductData.discount = discount;
                updatedProductData.finalPrice = discount > 0
                    ? Math.round(updatedSunglass.price - (updatedSunglass.price * discount) / 100)
                    : updatedSunglass.price;
            }
            if (tags) updatedProductData.tags = tags;
            if (gender) updatedProductData.gender = gender;
            const updatedProduct = await Product.findOneAndUpdate(
                { sunglassRef: id },
                updatedProductData,
                { new: true }
            );
            res.status(200).json({
                message: "Sunglass updated successfully",
                sunglass: updatedSunglass,
                product: updatedProduct,
            });
        } catch (error) {
            res.status(500).json({ message: "Error updating sunglass", error });
        }
    };

    deleteSunglass = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const sunglass = await Sunglass.findById(id);
            if (!sunglass) {
                res.status(404).json({ message: "Sunglass not found" });
                return;
            }
            if (sunglass.imagePublicId) {
                await cloudinary.uploader.destroy(sunglass.imagePublicId);
            }
            await sunglass.deleteOne();
            await Product.findOneAndDelete({ sunglassRef: id });
            res.status(204).json({ message: "Sunglass and associated product deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting sunglass", error });
        }
    };
}

export default new SunglassController(); 