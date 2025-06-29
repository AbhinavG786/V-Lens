import { Request, Response } from "express";
import { Cart } from "../models/cartModel";
import mongoose from 'mongoose';

// Create / Add to Cart
export const addToCart = async (req: Request, res: Response) => {
  const { userId, productId, quantity = 1 } = req.body;
  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const index = cart.items.findIndex(item => item.productId.toString() === productId);

      if (index > -1) {
        cart.items[index].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }

      await cart.save();
      res.status(200).json(cart);
      return;
    }

    const newCart = await Cart.create({ userId, items: [{ productId, quantity }] });
    res.status(201).json(newCart);
    return;
} catch (err) {
    res.status(500).json({ message: "Error adding to cart", error: err });
    return;
  }
};

// Read / Get Cart
export const getCart = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate("items.productId");
    if (!cart) {
        res.status(404).json({ message: "Cart not found" });
        return;
    }
    res.json(cart);
    return;
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart", error: err });
    return;
  }
};

// Update quantity
export const updateItemQuantity = async (req: Request, res: Response) => {
  const { userId, productId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart){ 
        res.status(404).json({ message: "Cart not found" });
        return;
    }

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
        res.status(404).json({ message: "Item not found" });
        return;
    }

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error updating item", error: err });
  }
};

// Remove item
export const removeFromCart = async (req: Request, res: Response) => {
  const { userId, productId } = req.body;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        res.status(404).json({ message: "Cart not found" });
        return;
    }

     const prodId = new mongoose.Types.ObjectId(productId);
    cart.items.pull({ productId: prodId });
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error removing item", error: err });
  }
};

// Clear cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const result = await Cart.findOneAndDelete({ userId: req.params.userId });
    if (!result) {
        res.status(404).json({ message: "Cart not found" });
        return;
    }
    
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing cart", error: err });
  }
};
