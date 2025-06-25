import { Product } from "../models/productModel";
import express from "express";

class ProductController {
  createProduct = async (req: express.Request, res: express.Response) => {
    const {
      type,
      name,
      brand,
      description,
      price,
      discount,
      finalPrice,
      images,
      variants,
      tags,
      ratings,
      gender,
      frameShape,
      material,
    } = req.body;

    // These fields are required
    if (
      !type ||
      !name ||
      !brand ||
      price === undefined ||
      finalPrice === undefined ||
      !images ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      res.status(400).json({
        message:
          "Missing required fields: type, name, brand, price, finalPrice, images",
      });
      return;
    }

    try {
      const product = new Product({
        type,
        name,
        brand,
        description,
        price,
        discount,
        finalPrice,
        images,
        variants,
        tags,
        ratings,
        gender,
        frameShape,
        material,
      });

      const saved = await product.save();
      res.status(201).json(saved);
    } catch (error) {
      res.status(400).json({ message: "Error creating product", error });
    }
  };

  getAllProducts = async (req: express.Request, res: express.Response) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error });
    }
  };

  getProductById = async (req: express.Request, res: express.Response) => {
    //if id is not provided,returning 404 not found status

    const { id } = req.params;
    if (!id) {
      res.status(404).json({ message: "Missing product ID in parameters" });
      return;
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error });
    }
  };

  updateProduct = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Missing product ID in parameters" });
      return;
    }

    const {
      type,
      name,
      brand,
      description,
      price,
      discount,
      finalPrice,
      images,
      variants,
      tags,
      ratings,
      gender,
      frameShape,
      material,
    } = req.body;

    try {
      const updated = await Product.findByIdAndUpdate(
        id,
        {
          type,
          name,
          brand,
          description,
          price,
          discount,
          finalPrice,
          images,
          variants,
          tags,
          ratings,
          gender,
          frameShape,
          material,
        },
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.status(200).json(updated);
    } catch (error) {
      res.status(400).json({ message: "Error updating product", error });
    }
  };

  deleteProduct = async (req: express.Request, res: express.Response) => {
    //if id is not provided,returning 404 not found status

    const { id } = req.params;
    if (!id) {
      res.status(404).json({ message: "Missing product ID in parameters" });
      return;
    }

    try {
      const deleted = await Product.findByIdAndDelete(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error });
    }
  };
}

export default new ProductController();
