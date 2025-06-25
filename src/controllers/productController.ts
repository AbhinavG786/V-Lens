import { Product } from "../models/productModel";
import express from "express";

class ProductController {
    createProduct = async (req: express.Request, res: express.Response) => {
        try {
        const product = new Product(req.body);
        const saved = await product.save();
        res.status(201).json(saved);
        } catch (error) {
        res.status(400).json({ message: "Error creating product", error });
        }
    };

    getAllProducts = async (_req: express.Request, res: express.Response) => {
        try {
        const products = await Product.find();
        res.status(200).json(products);
        } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
        }
    };

    getProductById = async (req: express.Request, res: express.Response) => {
        try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        res.status(200).json(product);
        } catch (error) {
        res.status(500).json({ message: "Error fetching product", error });
        }
    };

  updateProduct = async (req: express.Request, res: express.Response) => {
        try {
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated)
            return res.status(404).json({ message: "Product not found" });
        res.status(200).json(updated);
        } catch (error) {
        res.status(400).json({ message: "Error updating product", error });
        }
    };

    deleteProduct = async (req: express.Request, res: express.Response) => {
        try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product deleted successfully" });
        } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
        }
    };
}

export default new ProductController();
