import { Address } from '../models/addressModel';
import express from 'express';

class AddressController {
  createAddress = async (req: express.Request, res: express.Response) => {
    try {
      const { 
        userId,
        pinCode, 
        locality, 
        addressLine, 
        city, 
        state,
        addressType,
        isDefault
      } = req.body;

      if (!pinCode || !locality || !addressLine || !city || !state) {
        res.status(400).json({ message: 'All required fields must be provided' });
        return;
      }
      if (!/^\d{6}$/.test(pinCode)) {
        res.status(400).json({ message: 'Invalid pin code format' });
        return;
      }

      if (isDefault) {
        await Address.updateMany({}, { isDefault: false });
      }

      const newAddress = await Address.create({
        userId,
        pinCode,
        locality,
        addressLine,
        city,
        state,
        addressType: addressType || 'Home',
        isDefault: isDefault || false
      });

      res.status(201).json({
        success: true,
        message: 'Delivery address added successfully',
        data: newAddress
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating address', error });
    }
  };

  getAllAddresses = async (req: express.Request, res: express.Response) => {
    try {
      const addresses = await Address.find().sort({ isDefault: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        count: addresses.length,
        data: addresses
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching addresses', error });
    }
  };

  setDefaultAddress = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'Address ID is required' });
      return;
    }
    try {
      await Address.updateMany({}, { isDefault: false });

      const updated = await Address.findByIdAndUpdate(
        id, 
        { isDefault: true }, 
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ message: "Address not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Default address updated successfully',
        data: updated
      });
    } catch (error) {
      res.status(500).json({ message: 'Error setting default address', error });
    }
  };

  updateAddress = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { pinCode, locality, addressLine, city, state } = req.body;
    if (!id) {
      res.status(400).json({ message: 'Address ID is required' });
      return;
    }
    try {
      const updatedData:any={}
      if (pinCode) {
        if (!/^\d{6}$/.test(pinCode)) {
          res.status(400).json({ message: 'Invalid pin code format' });
          return;
        }
        updatedData.pinCode = pinCode;
      }
      if (locality) updatedData.locality = locality;
      if (addressLine) updatedData.addressLine = addressLine;
      if (city) updatedData.city = city;
      if (state) updatedData.state = state;
      const updated = await Address.findByIdAndUpdate(id, updatedData, { new: true });

      if (!updated) {
        res.status(404).json({ message: "Address not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
        data: updated
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating address', error });
    }
  };

  deleteAddress = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'Address ID is required' });
      return;
    }
    try {
      const deleted = await Address.findByIdAndDelete(id);

      if (!deleted) {
        res.status(404).json({ message: "Address not found" });
        return;
      }

      res.status(200).json({ 
        message: "Address deleted successfully"
      });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting address', error });
    }
  };

  getAddressById = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'Address ID is required' });
      return;
    }
    try {
      const address = await Address.findById(id);

      if (!address) {
        res.status(404).json({ message: 'Address not found' });
        return;
      }

      res.status(200).json(address);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching address', error });
    }
  };
}

export default new AddressController();
