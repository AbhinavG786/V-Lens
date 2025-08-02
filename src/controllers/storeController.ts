import express from "express";
import Store from "../models/storeModel";

class StoreController {
  findNearby = async (req: express.Request, res: express.Response) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    const parsedLat = parseFloat(lat as string);
    const parsedLng = parseFloat(lng as string);
    const parsedRadius = parseInt(radius as string);

    if (
      isNaN(parsedLat) ||
      isNaN(parsedLng) ||
      isNaN(parsedRadius)
    ) {
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
    const { name, address, location } = req.body;
    if (!name || !address || !location) {
      res.status(400).json({ error: "Please provide all required fields" });
      return;
    }
    try {
      const newStore = new Store({ name, address, location });
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
    const { name, location, address } = req.body;
    try {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (location)
        updateData.location = {
          type: "Point",
          coordinates: [location.lng, location.lat],
        };
      const updatedStore = await Store.findByIdAndUpdate(id, updateData, {
        new: true,
      });
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
}

export default new StoreController();
