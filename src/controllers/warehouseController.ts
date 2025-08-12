import express from "express";
import mongoose from "mongoose";
import { Warehouse } from "../models/warehouseModel";
import { Inventory } from "../models/inventoryModel";
import { Product } from "../models/productModel";

class WarehouseController {
  createWarehouse = async (req: express.Request, res: express.Response) => {
    const { warehouseName, address, contactNumber, isActive } = req.body;
    if (!warehouseName || !address || !contactNumber) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    try {
      const warehouse = new Warehouse({
        warehouseName,
        address,
        contactNumber,
        isActive,
      });
      const savedWarehouse = await warehouse.save();
      res.status(201).json(savedWarehouse);
    } catch (error) {
      res.status(500).json({ error: "Failed to create warehouse" });
    }
  };

  getAllWarehouses = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const warehouses = await Warehouse.find()
        .skip(Number(skip))
        .limit(Number(take));
      const total = await Warehouse.countDocuments();

      res.json({
        data: warehouses,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve warehouses" });
    }
  };

  getWarehouseById = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Warehouse ID is required" });
      return;
    }
    try {
      const warehouse = await Warehouse.findById(id);
      if (!warehouse) {
        res.status(404).json({ error: "Warehouse not found" });
        return;
      }
      res.json(warehouse);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve warehouse" });
    }
  };

  updateWarehouseById = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { warehouseName, address, contactNumber, isActive } = req.body;
    if (!id) {
      res.status(400).json({ error: "Warehouse ID is required" });
      return;
    }
    try {
      const updatedData: any = {};
      if (warehouseName) updatedData.warehouseName = warehouseName;
      if (address) updatedData.address = address;
      if (contactNumber) updatedData.contactNumber = contactNumber;
      if (isActive !== undefined) updatedData.isActive = isActive;
      const updatedWarehouse = await Warehouse.findByIdAndUpdate(
        id,
        updatedData,
        { new: true }
      );
      if (!updatedWarehouse) {
        res.status(404).json({ error: "Updated Warehouse not found" });
        return;
      }
      res.json(updatedWarehouse);
    } catch (error) {
      res.status(500).json({ error: "Failed to update warehouse" });
    }
  };

  // deleteWarehouseById = async (req: express.Request, res: express.Response) => {
  //   const { id } = req.params;
  //   if (!id) {
  //     res.status(400).json({ error: "Warehouse ID is required" });
  //     return;
  //   }
  //   try {
  //     const inventories = await Inventory.find({ warehouseId: id });
  //     // const inventorySet = new Set<mongoose.Types.ObjectId>();
  //     // inventorySet.add(inventory.productId);
  //     const typeToRefMap: Record<string, string> = {
  //       lenses: "lensRef",
  //       frames: "frameRef",
  //       accessories: "accessoriesRef",
  //       sunglasses: "sunglassesRef",
  //       eyeglasses: "eyeglassesRef",
  //     };

  //     for (const inventory of inventories) {
  //       const product = await Product.findById(inventory.productId);
  //       if (!product) {
  //         continue
  //       }
  //       const refField = typeToRefMap[product.type];
  //       if (refField) {
  //         const populatedProduct = await product.populate<{
  //           [key: string]: { stock: number } | null;
  //         }>({
  //           path: refField,
  //           select: "stock",
  //         });
  //         const subDoc = (populatedProduct as any)[refField];
  //         if (subDoc) {
  //           subDoc.stock -= inventory.stock;
  //         }
  //       }
  //     }

  //     await Inventory.deleteMany({ warehouseId: id });
  //     await Warehouse.findByIdAndDelete(id);

  //     res.status(204).json({ message: "Warehouse deleted successfully" });
  //   } catch (error) {
  //     res.status(500).json({ error: "Failed to delete warehouse" });
  //   }
  // };

  deleteWarehouseById = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  if (!id) {
     res.status(400).json({ error: "Warehouse ID is required" });
     return
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const inventories = await Inventory.find({ warehouseId: id }).session(session);
    // if (inventories.length === 0) {
    //   await session.abortTransaction();
    //   return res
    //     .status(404)
    //     .json({ error: "No inventory items found for this warehouse" });
    // }

    const typeToRefMap: Record<string, string> = {
      lenses: "lensRef",
      frames: "frameRef",
      accessories: "accessoriesRef",
      sunglasses: "sunglassesRef",
      eyeglasses: "eyeglassesRef",
    };

    const stockUpdates: { model: mongoose.Model<any>; id: any; decrement: number }[] = [];

    const productIds = inventories.map(inv => inv.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    for (const inventory of inventories) {
      const product = products.find(p => p._id.equals(inventory.productId));
      if (!product) {
        await session.abortTransaction();
         res.status(404).json({ error: "Product not found for inventory item" });
         return
      }

      const refField = typeToRefMap[product.type];
      if (refField && (product as any)[refField]) {
        stockUpdates.push({
          model: mongoose.model((product as any)[refField].constructor.modelName),
          id: (product as any)[refField]._id,
          decrement: inventory.stock,
        });
      }
    }

    for (const update of stockUpdates) {
      await update.model.updateOne(
        { _id: update.id },
        { $inc: { stock: -update.decrement } }
      ).session(session);
    }
    await Warehouse.findByIdAndDelete(id).session(session);
    await Inventory.deleteMany({ warehouseId: id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(204).json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ error: "Failed to delete warehouse" });
  }
};
}



export default new WarehouseController();
