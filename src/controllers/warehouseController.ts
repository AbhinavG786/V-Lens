import express from "express";
import { Warehouse } from "../models/warehouseModel";
import { Inventory } from "../models/inventoryModel";

class WarehouseController {
  createWarehouse = async (req: express.Request, res: express.Response) => {
    const {
      warehouseName,
      address,
      contactNumber,
      isActive,
    } = req.body;
    if (
      !warehouseName ||
      !address ||
      !contactNumber
    ) {
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
  }

    updateWarehouseById = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const {
      warehouseName,
      address,
      contactNumber,
      isActive,
    }=req.body;
    if (!id) {
      res.status(400).json({ error: "Warehouse ID is required" });
      return;
    }
    try{
        const updatedData:any = {};
        if (warehouseName) updatedData.warehouseName = warehouseName;
        if (address) updatedData.address = address;
        if (contactNumber) updatedData.contactNumber = contactNumber;
        if (isActive !== undefined) updatedData.isActive = isActive;
        const updatedWarehouse = await Warehouse.findByIdAndUpdate(id, updatedData, { new: true });
        if (!updatedWarehouse) {
          res.status(404).json({ error: "Updated Warehouse not found" });
          return;
        }
        res.json(updatedWarehouse);
    } catch (error) {
      res.status(500).json({ error: "Failed to update warehouse" });
    }
}

    deleteWarehouseById = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: "Warehouse ID is required" });
        return;
    }
    try {
        const deletedWarehouse = await Warehouse.findByIdAndDelete(id);
        if (!deletedWarehouse) {
            res.status(404).json({ error: "Warehouse not found" });
            return;
        }
        res.json({ message: "Warehouse deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete warehouse" });
    }
}
}

export default new WarehouseController();
