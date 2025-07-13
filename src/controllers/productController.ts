import { Product } from "../models/productModel";
import { Request, Response } from "express";
import express from "express";

class ProductController {
    getTrendingProducts = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const trending = await Product.find()
        .sort({ "ratings.count": -1 }) // Most reviewed product
        .limit(limit)
        .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef");

        res.status(200).json({ message: "Trending products fetched", products: trending });
        return;
    } catch (error) {
        res.status(500).json({ message: "Error fetching trending products", error });
        return;
    }
    };

    getRandomProducts = async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const count = await Product.countDocuments();
            const random = Math.max(0, Math.floor(Math.random() * Math.max(1, count - limit)));

            const products = await Product.find()
            .skip(random)
            .limit(limit)
            .populate("lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef");

            res.status(200).json({ message: "Random products fetched", products });
        } catch (error) {
            res.status(500).json({ message: "Error fetching random products", error });
        }
    };

}

export default new ProductController();
