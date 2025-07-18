import { Request, Response } from "express";
import { Frame } from "../models/frameModel";
import { Product } from "../models/productModel";
import { uploadBufferToCloudinary } from "../utils/cloudinary";
import cloudinary from "../utils/cloudinary";

class FrameController {
    createFrame = async (req: Request, res: Response) => {
        const {
        brand,
        shape,
        material,
        color,
        size,
        stock,
        price,
        description,
        name,
        discount,
        tags,
        gender,
        folder = "frame",
        } = req.body;

        const folderType = req.body.folder || req.query.folder || "others";

        if (!brand || !shape || !material || !color || !size || !stock ||!price || !description) {
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

        const frame = await Frame.create({
            brand,
            shape,
            material,
            color,
            size,
            stock,
            price,
            description,
            imageUrl: uploaded.secure_url,
            imagePublicId: uploaded.public_id,
        });

        const product = await Product.create({
            type: "frames",
            name,
            discount,
            finalPrice: discount > 0 ? Math.round(price - (price * discount) / 100) : price,
            tags,
            gender,
            frameRef: frame._id,
        });

        res.status(201).json({
            message: "Frame and Product created successfully",
            frame,
            product,
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
        stock,
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
        if (stock) updatedData.stock = stock;
        if (price) updatedData.price = price;
        if (description) updatedData.description = description;

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
        if (discount) {
            updatedProductData.discount = discount;
            updatedProductData.finalPrice = discount > 0
            ? Math.round(updatedFrame.price - (updatedFrame.price * discount) / 100)
            : updatedFrame.price;
        }
        if (tags) updatedProductData.tags = tags;
        
        const allowedGenders = ["men", "women", "unisex"];
        if (gender && allowedGenders.includes(gender)) {
            updatedProductData.gender = gender;
        } else if (gender) {
            res.status(400).json({ message: "Invalid gender value" });
            return;
        }

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
        await Product.findOneAndDelete({ frameRef: id });

        res.status(204).json({ message: "Frame and associated product deleted successfully" });
        } 
        catch (error) {
            res.status(500).json({ message: "Error deleting frame", error });
        }
    };
}

export default new FrameController();
