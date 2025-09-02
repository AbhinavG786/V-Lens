import express from "express";
import mongoose from "mongoose";
import { Warehouse } from "../models/warehouseModel";
import { Inventory } from "../models/inventoryModel";
import { Product } from "../models/productModel";
import { Store } from "../models/storeModel";
import sendMailer from "../utils/sendMailer";
import admin from "../firebase/firebaseInit";
import { User } from "../models/userModel";

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

  createWarehouseManager = async (
    req: express.Request,
    res: express.Response
  ) => {
    // dont keep isAgent and isAdmin true together, only one should be true at a time, also give currentLoad and maxLoad values only during agent signup
    // if isAdmin is true, then currentLoad and maxLoad should not be given,
    //for warehouse sign in send isWarehouseManager as true while keep isAgent and isAdmin false
    const { fullName, idToken, phone, isWarehouseManager = true } = req.body;
    if (!idToken) {
      res.status(400).json({ error: "ID token required" });
      return;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken, true);
      const provider = decoded.firebase?.sign_in_provider; // "google.com" or "password"

      let user = await User.findOne({ firebaseUID: decoded.uid });
      if (!user) {
        const Name = decoded.name || fullName;
        if (!Name) {
          res
            .status(400)
            .json({ error: "Full name is required for new user." });
          return;
        }
        if (!phone) {
          res
            .status(400)
            .json({ error: "Phone number is required for new user." });
          return;
        }
        const globalPhoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!globalPhoneRegex.test(phone)) {
          res
            .status(400)
            .json({
              error:
                "Invalid phone number. Use E.164 format, e.g., +14155552671",
            });
          return;
        }
        user = await User.create({
          firebaseUID: decoded.uid,
          email: decoded.email,
          fullName: Name,
          loginMethod: provider === "google.com" ? "google" : "email",
          phone: phone,
          isWarehouseManager: isWarehouseManager,
          addresses: [],
          wishlist: [],
          prescriptions: [],
        });
      } else {
        res.status(409).json({ error: "User already exists" });
        return;
      }

      res.status(200).json({ message: "Warehouse Manager creation successful", user });
    } catch (error) {
      console.error("Warehouse Manager creation failed:", error);
      res.status(401).json({ error: "Failed to create Warehouse Manager" });
    }
  };

  assignWarehouseManager = async (req: express.Request, res: express.Response) => {
    const { warehouseId, userId } = req.body;
    if (!warehouseId || !userId) {
      res.status(400).json({ error: "Warehouse ID and User ID are required" });
      return;
    }
    try {
      const warehouse = await Warehouse.findById(warehouseId);
      if (!warehouse) {
        res.status(404).json({ error: "Warehouse not found" });
        return;
      }
      const user=await User.findById(userId);
      if (!user || !user.isWarehouseManager) {
        res.status(404).json({ error: "Warehouse User not found" });
        return;
      }
      warehouse.warehouseManager = userId;
      await warehouse.save();
      res.status(200).json({ message: "Warehouse Manager assigned successfully" });
    } catch (error) {
      console.error("Failed to assign Warehouse Manager:", error);
      res.status(500).json({ error: "Failed to assign Warehouse Manager" });
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
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventories = await Inventory.find({ warehouseId: id }).session(
        session
      );
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

      const stockUpdates: {
        model: mongoose.Model<any>;
        id: any;
        decrement: number;
      }[] = [];

      const productIds = inventories.map((inv) => inv.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(
        session
      );

      for (const inventory of inventories) {
        const product = products.find((p) => p._id.equals(inventory.productId));
        if (!product) {
          await session.abortTransaction();
          res
            .status(404)
            .json({ error: "Product not found for inventory item" });
          return;
        }

        const refField = typeToRefMap[product.type];
        if (refField && (product as any)[refField]) {
          stockUpdates.push({
            model: mongoose.model(
              (product as any)[refField].constructor.modelName
            ),
            id: (product as any)[refField]._id,
            decrement: inventory.stock,
          });
        }
      }

      for (const update of stockUpdates) {
        await update.model
          .updateOne({ _id: update.id }, { $inc: { stock: -update.decrement } })
          .session(session);
      }

      await Store.updateMany(
        { warehouses: id },
        { $pull: { warehouses: id } }
      ).session(session);
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

  transferStockAcrossWarehouses = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { sourceWarehouseId, destinationWarehouseId, productId, quantity } =
      req.body;

    if (
      !sourceWarehouseId ||
      !destinationWarehouseId ||
      !productId ||
      !quantity
    ) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sourceInventory = await Inventory.findOneAndUpdate(
        { warehouseId: sourceWarehouseId, productId: productId },
        { $inc: { stock: -quantity } },
        { new: true, session }
      );

      if (!sourceInventory || sourceInventory.stock < 0) {
        await session.abortTransaction();
        res
          .status(400)
          .json({ error: "Insufficient stock in source warehouse" });
        return;
      }
      const data = {
        productId: productId,
        currentStock: sourceInventory.stock,
        threshold: sourceInventory.threshold
      }

      if (sourceInventory.stock < sourceInventory.threshold) {
        //send email to warehouse manager and admin
        await sendMailer.sendInsufficientStockUpdate(data);
        await session.abortTransaction();
        res
          .status(400)
          .json({ message: "Stock below threshold in source warehouse" });
        return;
      }

      const destinationInventory = await Inventory.findOneAndUpdate(
        { warehouseId: destinationWarehouseId, productId: productId },
        { $inc: { stock: quantity } },
        { new: true, session }
      );

      if (!destinationInventory) {
        await session.abortTransaction();
        res.status(404).json({ error: "Destination warehouse not found" });
        return;
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ message: "Stock transferred successfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      res.status(500).json({ error: "Failed to transfer stock" });
    }
  };

  getAllWarehouseManagers=async(req:express.Request,res:express.Response)=>{
    const {skip,take}=req.pagination!
    try{
    const managers=await User.find({isWarehouseManager:true}).skip(Number(skip)).limit(Number(take))
    const total=await User.countDocuments({isWarehouseManager:true})
     res.json({
        data: managers,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve warehouse managers" });
    }
  }
}

export default new WarehouseController();
