import { Request, Response } from "express";
import mongoose from "mongoose";
import { Inventory } from "../models/inventoryModel";
import { Product } from "../models/productModel";

class InventoryController {
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

  updateInventoryItem = async (req: Request, res: Response) => {
    const { productId, warehouseId } = req.params;
    const { SKU, stock, threshold } = req.body;
    if (!productId || !warehouseId) {
      res
        .status(400)
        .json({ error: "Product ID and Warehouse ID are required" });
      return;
    }
    try {
      const updatedData: any = {};
      if (SKU) updatedData.SKU = SKU;
      if (stock !== undefined) updatedData.stock = stock;
      if (threshold !== undefined) updatedData.threshold = threshold;
      const item = await Inventory.findOneAndUpdate(
        { productId, warehouseId },
        updatedData,
        { new: true }
      );
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      if (stock !== undefined) {
        const inventories = await Inventory.find({ productId });
        const totalStock = inventories.reduce((sum, inv) => sum + inv.stock, 0);
        const product = await Product.findById(productId);

        if (!product) {
          res.status(404).json({ error: "Product not found" });
          return;
        }
        const typeToRefMap: Record<string, string> = {
          lenses: "lensRef",
          frames: "frameRef",
          accessories: "accessoriesRef",
          sunglasses: "sunglassesRef",
          eyeglasses: "eyeglassesRef",
        };

        const refField = typeToRefMap[product.type];
        if (refField) {
          const populatedProduct = await product.populate<{
            [key: string]: { stock: number } | null;
          }>({
            path: refField,
            select: "stock",
          });
          const subDoc = (populatedProduct as any)[refField];
          if (subDoc) {
            subDoc.stock = totalStock;
            await subDoc.save();
          }
        }
      }
      res.status(200).json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  };

  deleteInventoryItem = async (req: Request, res: Response) => {
    const { productId, warehouseId } = req.params;
    if (!productId || !warehouseId) {
      res
        .status(400)
        .json({ error: "Product ID and Warehouse ID are required" });
      return;
    }
    try {
      const item = await Inventory.findOne({ productId, warehouseId });
      if (!item) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      const product = await Product.findById(productId);

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const typeToRefMap: Record<string, string> = {
        lenses: "lensRef",
        frames: "frameRef",
        accessories: "accessoriesRef",
        sunglasses: "sunglassesRef",
        eyeglasses: "eyeglassesRef",
      };

      const refField = typeToRefMap[product.type];
      if (refField) {
        const populatedProduct = await product.populate<{
          [key: string]: { stock: number } | null;
        }>({
          path: refField,
          select: "stock",
        });
        const subDoc = (populatedProduct as any)[refField];
        if (subDoc) {
          subDoc.stock -= item.stock;
          await subDoc.save();
        }
      }
      await Inventory.deleteOne({ productId, warehouseId });
      res.status(204).json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  };

  getEachProductStockInWarehouse = async (req: Request, res: Response) => {
    const { warehouseId } = req.params;
    if (!warehouseId) {
      res.status(400).json({ error: "Warehouse ID is required" });
      return;
    }
    try {
      const inventories = await Inventory.find({ warehouseId }).populate({
        path: "productId",
        select:
          "name type lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef",
        populate: [
          { path: "lensRef", select: "stock" },
          { path: "frameRef", select: "stock" },
          { path: "accessoriesRef", select: "stock" },
          { path: "sunglassesRef", select: "stock" },
          { path: "eyeglassesRef", select: "stock" },
        ],
      });
      if (inventories.length === 0) {
        res
          .status(404)
          .json({ error: "No inventory items found for this warehouse" });
        return;
      }

      const results = inventories.map((entry) => {
        const product: any = entry.productId;

        let refStock = null;

        switch (product?.type) {
          case "lenses":
            refStock = product.lensRef?.stock || 0;
            break;
          case "frames":
            refStock = product.frameRef?.stock || 0;
            break;
          case "accessories":
            refStock = product.accessoriesRef?.stock || 0;
            break;
          case "sunglasses":
            refStock = product.sunglassesRef?.stock || 0;
            break;
          case "eyeglasses":
            refStock = product.eyeglassesRef?.stock || 0;
            break;
        }

        return {
          productId: product._id,
          name: product.name,
          type: product.type,
          stockInWarehouse: entry.stock,
          totalStock: refStock,
          threshold: entry.threshold,
          sku: entry.SKU,
        };
      });

      res.status(200).json(results);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ error: "Failed to fetch inventory items" });
    }
  };

  getAllProductStocksByTypeInWarehouse = async (
    req: Request,
    res: Response
  ) => {
    const { warehouseId } = req.params;
    if (!warehouseId) {
      res.status(400).json({ error: "Warehouse ID is required" });
      return;
    }
    try {
      const result = await Inventory.aggregate([
        {
          $match: {
            warehouseId: new mongoose.Types.ObjectId(warehouseId),
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.type",
            totalStock: { $sum: "$stock" },
          },
        },
        {
          $project: {
            _id: 0,
            type: "$_id",
            totalStock: 1,
          },
        },
      ]);
      const stockByType = result.reduce((acc, item) => {
        acc[item.type] = item.totalStock;
        return acc;
      }, {} as Record<string, number>);

      res.status(200).json(stockByType);
    } catch (error) {
      console.error("Error fetching product stocks:", error);
      res.status(500).json({ error: "Failed to fetch product stocks" });
    }
  };

  getTotalStockForProduct = async (req: Request, res: Response) => {
    const { productId } = req.params;
    if (!productId) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }
    try {
      const result = await Inventory.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $group: {
            _id: "$productId",
            totalStock: { $sum: "$stock" },
          },
        },
      ]);

      const output = result[0]?.totalStock ?? 0;
      res.status(200).json({ totalStock: output });
    } catch (error) {
      console.error("Error fetching total stock for product:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch total stock for product" });
    }
  };
}

export default new InventoryController();
