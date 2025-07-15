import { Frame } from '../models/frameModel';
import { Lens } from '../models/lensModel';
import { Accessories } from '../models/accessoriesModel';
import { Product } from '../models/productModel';
import { Request, Response } from 'express';

export class InventoryController {
  /**
   * Checks if there is enough stock for the given product and quantity.
   * Returns true if enough stock, false otherwise.
   */
  static async hasSufficientStock(product: any, quantity: number): Promise<boolean> {
    if (!product) return false;
    switch (product.type) {
      case 'frames': {
        if (!product.frameRef) return false;
        const frame = await Frame.findById(product.frameRef);
        return frame && typeof frame.stock === 'number' && frame.stock >= quantity;
      }
      case 'lenses': {
        if (!product.lensRef) return false;
        const lens = await Lens.findById(product.lensRef);
        return lens && typeof lens.stock === 'number' && lens.stock >= quantity;
      }
      case 'accessories': {
        if (!product.accessoriesRef) return false;
        const accessories = await Accessories.findById(product.accessoriesRef);
        return accessories && typeof accessories.stock === 'number' && accessories.stock >= quantity;
      }
      // Add more cases for other product types if needed
      default:
        return false;
    }
  }

  /**
   * Decrements the stock for the given product and quantity.
   * Returns true if successful, false otherwise.
   */
  static async decrementStock(product: any, quantity: number): Promise<boolean> {
    if (!product) return false;
    switch (product.type) {
      case 'frames': {
        if (!product.frameRef) return false;
        const frame = await Frame.findById(product.frameRef);
        if (frame && typeof frame.stock === 'number' && frame.stock >= quantity) {
          frame.stock -= quantity;
          await frame.save();
          return true;
        }
        return false;
      }
      case 'lenses': {
        if (!product.lensRef) return false;
        const lens = await Lens.findById(product.lensRef);
        if (lens && typeof lens.stock === 'number' && lens.stock >= quantity) {
          lens.stock -= quantity;
          await lens.save();
          return true;
        }
        return false;
      }
      case 'accessories': {
        if (!product.accessoriesRef) return false;
        const accessories = await Accessories.findById(product.accessoriesRef);
        if (accessories && typeof accessories.stock === 'number' && accessories.stock >= quantity) {
          accessories.stock -= quantity;
          await accessories.save();
          return true;
        }
        return false;
      }
      // Add more cases for other product types if needed
      default:
        return false;
    }
  }
}
