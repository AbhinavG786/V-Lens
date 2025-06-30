import { Lens } from "../models/lensModel";
import express from "express";

class LensController {
  createLens = async (req: express.Request, res: express.Response) => {
    const { brand, type, price, stock, description, imageUrl,color,power } = req.body;
    if (!brand || !type || !price || !stock || !description || !imageUrl || !color || !power) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    try {
      const newLens = new Lens({
        brand,
        type,
        price,
        stock,
        description,
        imageUrl,
        color,
        power
      });
      const savedLens = await newLens.save();
      res
        .status(201)
        .json({ message: "Lens created successfully", lens: savedLens });
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

  updateLens = async (req: express.Request, res: express.Response) => {
    const { lensId } = req.params;
    const { brand, type, price, stock, description, imageUrl,color,power } = req.body;
    try {
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
      if (imageUrl) updatedData.imageUrl = imageUrl;
      if (color) updatedData.color = color;
      if (power) updatedData.power = power;
      const updatedLens = await Lens.findByIdAndUpdate(lensId, updatedData, {
        new: true,
      });
      if (!updatedLens) {
        res.status(404).json({ message: "Lens not found" });
        return;
      }
      res
        .status(200)
        .json({ message: "Lens updated successfully", lens: updatedLens });
    } catch (error) {
      console.error("Error updating lens:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteLens = async (req: express.Request, res: express.Response) => {
    const { lensId } = req.params;
    try {
      const deletedLens = await Lens.findByIdAndDelete(lensId);
      if (!deletedLens) {
        res.status(404).json({ message: "Lens not found" });
        return;
      }
      res.status(204).json({ message: "Lens deleted successfully" });
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
