import { Request, Response } from "express";
import { Inventory } from "../models/inventoryModel";

class InventoryController {
  createInventoryItem = async (req: Request, res: Response) => {
    try {
      const { productId, SKU, stock, threshold, locations } = req.body;

      if (!productId || !SKU || stock === undefined || threshold === undefined || !locations) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const newItem = new Inventory({ productId, SKU, stock, threshold, locations });
      await newItem.save();
      res.status(201).json(newItem);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getAllInventoryItems = async (req: Request, res: Response) => {
    try {
      const items = await Inventory.find();
      res.status(200).json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getInventoryItemById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "Item ID is required" });
        return;
      }

      const item = await Inventory.findById(id);
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      res.status(200).json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  updateInventoryItemById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { productId, SKU, stock, threshold, locations } = req.body;

      if (!id) {
        res.status(400).json({ error: "Item ID is required" });
        return;
      }

      if (!productId || !SKU || stock === undefined || threshold === undefined || !locations) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const item = await Inventory.findByIdAndUpdate(
        id,
        { productId, SKU, stock, threshold, locations },
        { new: true }
      );

      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      res.status(200).json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  deleteInventoryItemById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "Item ID is required" });
        return;
      }

      const item = await Inventory.findByIdAndDelete(id);
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      res.status(204).json({ message: "Item deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

export default new InventoryController();