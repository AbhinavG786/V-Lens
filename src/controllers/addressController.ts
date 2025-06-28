import { Address } from '../models/addressSchema';
import express from 'express';

class AddressController {
  createAddress = async (req: express.Request, res: express.Response) => {
    try {
      const { 
        fullName, 
        mobileNumber, 
        alternativeMobile,
        pinCode, 
        locality, 
        addressLine, 
        city, 
        state,
        addressType,
        landmark,
        isDefault
      } = req.body;

      if (!fullName || !mobileNumber || !pinCode || !locality || !addressLine || !city || !state) {
        res.status(400).json({ message: 'All required fields must be provided' });
        return;
      }

      // Basic validation for Lenskart India
      if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        res.status(400).json({ message: 'Invalid mobile number format' });
        return;
      }

      if (!/^\d{6}$/.test(pinCode)) {
        res.status(400).json({ message: 'Invalid pin code format' });
        return;
      }

      // If this is set as default, make others non-default
      if (isDefault) {
        await Address.updateMany({}, { isDefault: false });
      }

      const newAddress = await Address.create({
        fullName,
        mobileNumber,
        alternativeMobile,
        pinCode,
        locality,
        addressLine,
        city,
        state,
        addressType: addressType || 'Home',
        landmark,
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
      // Remove default from all addresses
      await Address.updateMany({}, { isDefault: false });
      
      // Set this address as default
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
    if (!id) {
      res.status(400).json({ message: 'Address ID is required' });
      return;
    }
    try {
      const updated = await Address.findByIdAndUpdate(id, req.body, { new: true });

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
