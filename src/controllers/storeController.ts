import express from "express";
import mongoose from "mongoose";
import { Inventory } from "../models/inventoryModel";
import { Order } from "../models/orderModel";
import { Product } from "../models/productModel";
import { Store } from "../models/storeModel";
import { Warehouse } from "../models/warehouseModel";
import admin from "../firebase/firebaseInit";
import { User } from "../models/userModel";
import { generateInvoicePDF } from "../utils/invoiceGenerator";

class StoreController {
  findNearby = async (req: express.Request, res: express.Response) => {
    try {
      const { lat, lng, radius = 5000 } = req.query;

      const parsedLat = parseFloat(lat as string);
      const parsedLng = parseFloat(lng as string);
      const parsedRadius = parseInt(radius as string);

      if (isNaN(parsedLat) || isNaN(parsedLng) || isNaN(parsedRadius)) {
        res.status(400).json({ error: "Invalid lat, lng, or radius" });
        return;
      }

      const nearby = await Store.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [parsedLng, parsedLat], // [lng, lat]
            },
            $maxDistance: parsedRadius,
          },
        },
      }).limit(20);

      res.json(nearby);
    } catch (err) {
      console.error("Error in findNearby:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  createStore = async (req: express.Request, res: express.Response) => {
    const {
      name,
      locality,
      city,
      state,
      zipCode,
      employeeCount,
      location,
      warehouseIds,
    } = req.body;
    if (
      !name ||
      !locality ||
      !city ||
      !state ||
      !zipCode ||
      !location ||
      !employeeCount ||
      !Array.isArray(warehouseIds) ||
      warehouseIds.length === 0
    ) {
      res.status(400).json({ error: "Please provide all required fields" });
      return;
    }
    try {
      const newStore = new Store({
        name,
        locality,
        city,
        state,
        zipCode,
        location,
        employeeCount,
        warehouses: warehouseIds,
      });
      await newStore.save();
      res.status(201).json(newStore);
    } catch (error) {
      res.status(500).json({ error: "Error creating store" });
    }
  };

  getStoreById = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    try {
      const store = await Store.findById(id);
      if (!store) {
        res.status(404).json({ error: "Store not found" });
        return;
      }
      res.json(store);
    } catch (error) {
      res.status(500).json({ error: "Error fetching store" });
    }
  };

  getAllStores = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const stores = await Store.find().skip(Number(skip)).limit(Number(take));
      if (!stores || stores.length === 0) {
        res.status(404).json({ error: "No stores found" });
        return;
      }
      const total = await Store.countDocuments();
      res.json({
        data: stores,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching stores" });
    }
  };

  updateStore = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const {
      name,
      location,
      employeeCount,
      address,
      warehouseIds,
      addWarehouses,
      removeWarehouses,
    } = req.body;
    try {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (employeeCount !== undefined) updateData.employeeCount = employeeCount;
      if (location)
        updateData.location = {
          type: "Point",
          coordinates: [location.lng, location.lat],
        };

      // Full replacement
      if (Array.isArray(warehouseIds)) {
        const validWarehouses = await Warehouse.find({
          _id: { $in: warehouseIds },
        }).select("_id");
        if (validWarehouses.length !== warehouseIds.length) {
          res
            .status(400)
            .json({ error: "One or more warehouse IDs are invalid" });
          return;
        }
        updateData.warehouses = warehouseIds;
      }

      // Add warehouses as in partial update
      if (Array.isArray(addWarehouses) && addWarehouses.length > 0) {
        const validToAdd = await Warehouse.find({
          _id: { $in: addWarehouses },
        }).select("_id");
        if (validToAdd.length !== addWarehouses.length) {
          res
            .status(400)
            .json({ error: "One or more warehouse IDs to add are invalid" });
          return;
        }
        await Store.findByIdAndUpdate(id, {
          $addToSet: { warehouses: { $each: addWarehouses } },
        });
      }

      // Remove warehouses
      if (Array.isArray(removeWarehouses) && removeWarehouses.length > 0) {
        await Store.findByIdAndUpdate(id, {
          $pull: { warehouses: { $in: removeWarehouses } },
        });
      }

      const updatedStore = Object.keys(updateData).length
        ? await Store.findByIdAndUpdate(id, updateData, { new: true })
        : await Store.findById(id);

      if (!updatedStore) {
        res.status(404).json({ error: "Store not found" });
        return;
      }
      res.json(updatedStore);
    } catch (error) {
      res.status(500).json({ error: "Error updating store" });
    }
  };

  deleteStore = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    try {
      const deletedStore = await Store.findByIdAndDelete(id);
      if (!deletedStore) {
        res.status(404).json({ error: "Store not found" });
        return;
      }
      res.json({ message: "Store deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting store" });
    }
  };

  filterStoresByCity = async (req: express.Request, res: express.Response) => {
    const { city } = req.query;
    const { skip, take } = req.pagination!;
    if (!city || typeof city !== "string") {
      res.status(400).json({ error: "City query parameter is required" });
      return;
    }
    try {
      const stores = await Store.find({ city })
        .skip(Number(skip))
        .limit(Number(take));
      if (!stores || stores.length === 0) {
        res
          .status(404)
          .json({ error: "No stores found for the specified city" });
        return;
      }
      const total = await Store.countDocuments({ city });
      res.json({
        data: stores,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching stores" });
    }
  };

  filterStoresByState = async (req: express.Request, res: express.Response) => {
    const { state } = req.query;
    const { skip, take } = req.pagination!;
    if (!state || typeof state !== "string") {
      res.status(400).json({ error: "State query parameter is required" });
      return;
    }
    try {
      const stores = await Store.find({ state })
        .skip(Number(skip))
        .limit(Number(take));
      if (!stores || stores.length === 0) {
        res
          .status(404)
          .json({ error: "No stores found for the specified state" });
        return;
      }
      const total = await Store.countDocuments({ state });
      res.json({
        data: stores,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching stores" });
    }
  };

  createStoreManager = async (req: express.Request, res: express.Response) => {
    // dont keep isAgent and isAdmin true together, only one should be true at a time, also give currentLoad and maxLoad values only during agent signup
    // if isAdmin is true, then currentLoad and maxLoad should not be given,
    //for warehouse sign in send isWarehouseManager as true while keep isAgent and isAdmin false
    //for store manager sign up send isStoreManager as true while keep isAgent and isAdmin false
    const { fullName, idToken, phone, isStoreManager = true } = req.body;
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
          res.status(400).json({
            error: "Invalid phone number. Use E.164 format, e.g., +14155552671",
          });
          return;
        }
        user = await User.create({
          firebaseUID: decoded.uid,
          email: decoded.email,
          fullName: Name,
          loginMethod: provider === "google.com" ? "google" : "email",
          phone: phone,
          isStoreManager: isStoreManager,
          addresses: [],
          wishlist: [],
          prescriptions: [],
        });
      } else {
        res.status(409).json({ error: "User already exists" });
        return;
      }

      res
        .status(200)
        .json({ message: "Store Manager creation successful", user });
    } catch (error) {
      console.error("Store Manager creation failed:", error);
      res.status(401).json({ error: "Failed to create Store Manager" });
    }
  };

  assignStoreManager = async (req: express.Request, res: express.Response) => {
    const { storeId, userId } = req.body;
    if (!storeId || !userId) {
      res.status(400).json({ error: "Store ID and User ID are required" });
      return;
    }
    try {
      const store = await Store.findById(storeId);
      if (!store) {
        res.status(404).json({ error: "Store not found" });
        return;
      }
      const user = await User.findById(userId);
      if (!user || !user.isStoreManager) {
        res.status(404).json({ error: "Store Manager user not found" });
        return;
      }
      store.storeManager = userId;
      await store.save();
      res
        .status(200)
        .json({ message: "Store Manager assigned successfully", store });
    } catch (error) {
      console.error("Error assigning Store Manager:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  fetchStoreAndWarehousesForManager = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    try {
      const user = await User.findById(userId);
      if (!user || !user.isStoreManager) {
        res.status(404).json({ error: "Store Manager user not found" });
        return;
      }
      const store = await Store.findOne({ storeManager: userId }).populate(
        "warehouses"
      );
      if (!store) {
        res.status(404).json({ error: "No store assigned to this manager" });
        return;
      }
      res.status(200).json({ store, warehouses: store.warehouses });
    } catch (error) {
      console.error("Error fetching store and warehouses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  getAllStoreManagers = async (req: express.Request, res: express.Response) => {
    const { skip, take } = req.pagination!;
    try {
      const storeManagers = await User.find({ isStoreManager: true })
        .select(
          "-wishlist -prescriptions -addresses -isAdmin -isAgent -isWarehouseManager -loginMethod -firebaseUID -__v"
        )
        .skip(skip)
        .limit(take);
      if (!storeManagers || storeManagers.length === 0) {
        res.status(404).json({ error: "No store managers found" });
        return;
      }
      const total = await User.countDocuments({ isStoreManager: true });
      res.json({
        data: storeManagers,
        total,
        skip: Number(skip),
        take: Number(take),
        totalPages: Math.ceil(total / Number(take)),
      });
    } catch (error) {
      console.error("Error fetching store managers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  deleteStoreManagerById = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    try {
      const user = await User.findById(userId);
      if (!user || !user.isStoreManager) {
        res.status(404).json({ error: "Store Manager user not found" });
        return;
      }
      await User.findByIdAndDelete(userId);
      res.status(200).json({ message: "Store Manager deleted successfully" });
    } catch (error) {
      console.error("Error deleting Store Manager:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  createOfflineOrder = async (req: express.Request, res: express.Response) => {
    const firebaseUID = req.user?.uid;

    const {
      items,
      paymentMethod,
      customerName,
      notes,
      warehouseId,
      isGSTPurchase,
      gstNumber,
      companyName,
      registrationNumber,
      companyAddress,
      shippingAddress,
    } = req.body;

    if (!firebaseUID) {
      res.status(401).json({ message: "Firebase Id is required" });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Order items are required." });
      return;
    }

    if (!warehouseId) {
      res.status(400).json({ message: "warehouseId is required." });
      return;
    }

    if (!shippingAddress || !paymentMethod) {
      res.status(400).json({
        message: "Shipping address, and payment method are required",
      });
      return;
    }
    if (paymentMethod) {
      const allowedMethods = (Order.schema.path("paymentMethod") as any)
        .enumValues;
      if (!allowedMethods.includes(paymentMethod)) {
        res.status(400).json({
          message: `Invalid payment method. Allowed methods are: ${allowedMethods.join(
            ", "
          )}`,
        });
        return;
      }
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ firebaseUID });
      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      const store = await Store.findOne({ storeManager: user._id }).populate(
        "warehouses"
      );
      if (!store) {
        res.status(403).json({ message: "Manager does not manage any store." });
        return;
      }

      if (
        !store.warehouses.some((w: any) => w._id.toString() === warehouseId)
      ) {
        res
          .status(400)
          .json({ message: "Warehouse is not linked to this store." });
        return;
      }

      let subtotal = 0;
      let discountAmount = 0;
      let gstAmountTotal = 0;
      const GST_RATE = 18;
      const orderItems: any[] = [];

      const typeToRefMap: Record<string, string> = {
        lenses: "lensRef",
        frames: "frameRef",
        accessories: "accessoriesRef",
        sunglasses: "sunglassesRef",
        eyeglasses: "eyeglassesRef",
      };

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          res
            .status(400)
            .json({ message: `Product with ID ${item.productId} not found` });
          return;
        }

        // Deduct stock from the chosen warehouse
        const inv = await Inventory.findOneAndUpdate(
          {
            productId: product._id,
            warehouseId,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!inv) {
          res
            .status(400)
            .json({ message: `Insufficient stock for ${product.name}` });
          return;
        }
        const refField = typeToRefMap[product.type];
        if (refField) {
          const populatedProduct = await product.populate<{
            [key: string]: {
              discount: number;
              finalPrice: number;
              price: number;
            } | null;
          }>({
            path: refField,
            select: "discount finalPrice price",
          });

          const subDoc = (populatedProduct as any)[refField];
          if (subDoc) {
            const pricePerUnit = subDoc.finalPrice;
            const discountPerUnit = subDoc.discount;
            const gstPerUnit = isGSTPurchase
              ? (pricePerUnit * GST_RATE) / 100
              : 0;
            const initialPrice = subDoc.price;

            subtotal += pricePerUnit * item.quantity;
            discountAmount += discountPerUnit * item.quantity;
            gstAmountTotal += gstPerUnit * item.quantity;

            orderItems.push({
              productId: item.productId,
              quantity: item.quantity,
              price: initialPrice,
              discount: discountPerUnit,
              finalPrice: pricePerUnit,
              gstAmount: gstPerUnit,
              warehouseId,
            });
          }
        }
      }

      const totalAmount = subtotal - discountAmount + gstAmountTotal;
      const orderNumber = `OFFLINE-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)}`;

      const order = new Order({
        userId: user._id,
        orderNumber,
        items: orderItems,
        subTotalAmount: subtotal,
        discountAmount,
        gstDetails: {
          isGSTPurchase: !!isGSTPurchase,
          gstNumber,
          companyName,
          registrationNumber,
          companyAddress,
          gstRate: isGSTPurchase ? GST_RATE : 0,
          gstAmount: gstAmountTotal,
        },
        totalAmount,
        shippingAddress,
        billingAddress: `${store.name}, ${store.locality}, ${store.city}, ${store.state} - ${store.zipCode}`,
        paymentMethod: paymentMethod || "cash",
        paymentStatus: "completed",
        notes,
        storeId: store._id,
        placedBy: "manager",
        customerName,
      });

      const savedOrder = await order.save({ session });
      const invoicePath = (await generateInvoicePDF(savedOrder)) as string;
      savedOrder.invoiceUrl = invoicePath;
      await savedOrder.save({ session });

      await session.commitTransaction();
      res.status(201).json({ order: savedOrder });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: "Error creating offline order", error });
      return;
    } finally {
      session.endSession();
    }
  };
}

export default new StoreController();
