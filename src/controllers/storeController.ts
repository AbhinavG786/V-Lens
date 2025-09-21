import express from "express";
import { Store } from "../models/storeModel";
import { Warehouse } from "../models/warehouseModel";

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
    const { name, locality, city, state, zipCode, employeeCount, location, warehouseIds } = req.body;
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
      const stores = await Store.find({ city }).skip(Number(skip)).limit(Number(take));
      if (!stores || stores.length === 0) {
        res.status(404).json({ error: "No stores found for the specified city" });
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
  }

  filterStoresByState = async (req: express.Request, res: express.Response) => {
    const { state } = req.query;
    const { skip, take } = req.pagination!;
    if (!state || typeof state !== "string") {
      res.status(400).json({ error: "State query parameter is required" });
      return;
    }
    try {
      const stores = await Store.find({ state }).skip(Number(skip)).limit(Number(take));
      if (!stores || stores.length === 0) {
        res.status(404).json({ error: "No stores found for the specified state" });
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
  }
}

export default new StoreController();
