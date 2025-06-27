import { Document, Types } from 'mongoose';
import { Address } from '../models/addressSchema'; 

import { Request, Response } from 'express';

export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: user not found in request" });
      return;
    }
    const newAddress = await Address.create({ ...req.body, userId: req.user._id });

    if (newAddress.isDefault) {
      await Address.updateMany(
        { userId: req.user._id, _id: { $ne: newAddress._id } },
        { isDefault: false }
      );
    }

    res.status(201).json(newAddress);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};

export const getUserAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: user not found in request" });
      return;
    }
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1 });
    res.json(addresses);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMessage });
  }
};

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: user not found in request" });
      return;
    }
    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    if (req.body.isDefault) {
      await Address.updateMany(
        { userId: req.user._id, _id: { $ne: updated._id } },
        { isDefault: false }
      );
    }

    res.json(updated);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: errorMessage });
  }
};

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: user not found in request" });
      return;
    }
    const deleted = await Address.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMessage });
  }
};
