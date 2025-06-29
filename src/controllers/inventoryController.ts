import { Request, Response } from "express";
import { Inventory } from "../models/inventoryModel";

class InventoryController {
  createInventoryItem = async (req: Request, res: Response) => {
    try {
      const { name, quantity, price } = req.body;
      if (!name || quantity === undefined || price === undefined) {
        res
          .status(400)
          .json({ error: "Missing required fields: name, quantity, price" });
        return;
      }
      const item = new Inventory({ name, quantity, price });
      await item.save();
      res.status(201).json(item);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  getAllInventoryItems = async (req: Request, res: Response) => {
    try {
      const items = await Inventory.find();
      res.json(items);
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
      res.status(201).json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  updateInventoryItemById = async (req: Request, res: Response) => {
    try {
      const { name, quantity, price } = req.body;
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Item ID is required" });
        return;
      }
      if (!name || quantity === undefined || price === undefined) {
        res
          .status(400)
          .json({ error: "Missing required fields: name, quantity, price" });
        return;
      }
      const item = await Inventory.findByIdAndUpdate(
        id,
        { name, quantity, price },
        { new: true }
      );
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      res.status(201).json(item);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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
