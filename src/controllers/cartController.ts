import { Request, Response } from "express";
import { Cart } from "../models/cartModel";
import { User } from "../models/userModel";
import mongoose from 'mongoose';

class CartController {
  private async findMongoUser(firebaseUID: string) {
    return await User.findOne({ firebaseUID });
  }

  addToCart = async (req: Request, res: Response) => {
    const firebaseUID = req.user?.uid;
    const { productId, quantity = 1 } = req.body;

    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized. No Firebase user identified." });
      return;
    }
    if (!productId) {
      res.status(400).json({ message: "productId is required." });
      return;
    }

    try {
      const mongoUser = await this.findMongoUser(firebaseUID);
      if (!mongoUser) {
        res.status(401).json({ message: "Unauthorized. User not found in database." });
        return;
      }
      const userId = mongoUser._id; 

      let cart = await Cart.findOne({ userId });

      if (cart) {
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += quantity;
        } else {
          cart.items.push({ productId, quantity });
        }
      } else {
        cart = new Cart({ userId, items: [{ productId, quantity }] });
      }
      
      await cart.save();
      await cart.populate({ path: 'items.productId', model: 'Product' });
      res.status(200).json(cart);

    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Server error while adding to cart.", error });
      return;
    }
  };

  getCart = async (req: Request, res: Response) => {
    const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized. No Firebase user identified." });
      return;
    }

    try {
      const mongoUser = await this.findMongoUser(firebaseUID);
      if (!mongoUser) {
        res.status(401).json({ message: "Unauthorized. User not found in database." });
        return;
      }
      const userId = mongoUser._id;

      // const cart = await Cart.findOne({ userId }).populate({
      //   path: 'items.productId',
      //   model: 'Product'
      // });
      const cart = await Cart.findOne({ userId }).populate({
        path: 'items.productId',
        model: 'Product',
        populate: {
          path: 'lensRef frameRef accessoriesRef sunglassesRef eyeglassesRef',
        }
      });

      if (!cart) {
        res.status(200).json({ userId: userId, items: [] });
      }
      
      res.status(200).json(cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Server error while fetching cart.", error });
      return;
    }
  };
  
  updateItemQuantity = async (req: Request, res: Response) => {
    const firebaseUID = req.user?.uid;
    const { productId, quantity } = req.body;

    if (!firebaseUID) {
       res.status(401).json({ message: "Unauthorized." }); 
       return;
    }
    if (!productId || quantity === undefined) {
      res.status(400).json({ message: "productId and quantity are required." }); 
      return;
    }
    
    try {
        const mongoUser = await this.findMongoUser(firebaseUID);
        if (!mongoUser)
        {
          res.status(401).json({ message: "User not found." }); 
          return;
        }
        const userId = mongoUser._id;

        if (quantity <= 0) {
            this.removeFromCart(req, res);
            return;
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) { 
          res.status(404).json({ message: "Cart not found." });
          return;
        }

        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item){ 
          res.status(404).json({ message: "Item not found in cart." }); 
          return;
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate({ path: 'items.productId', model: 'Product' });
        res.status(200).json(cart);
    } catch (error) {
        console.error("Error updating item quantity:", error);
        res.status(500).json({ message: "Server error while updating item quantity.", error });
        return;
    }
  };

  removeFromCart = async (req: Request, res: Response) => {
    const firebaseUID = req.user?.uid;
    const { productId } = req.body;

    if (!firebaseUID) { 
      res.status(401).json({ message: "Unauthorized." });
      return; 
    }
    if (!productId) 
    { 
      res.status(400).json({ message: "productId is required." });
      return; 
    }

    try {
        const mongoUser = await this.findMongoUser(firebaseUID);
        if (!mongoUser) {
          res.status(401).json({ message: "User not found." }); 
          return;
        }
        const userId = mongoUser._id;

        const updatedCart = await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId: productId } } },
            { new: true }
        ).populate({ path: 'items.productId', model: 'Product' });

        if (!updatedCart)
        { 
          res.status(404).json({ message: "Cart not found or item not in cart." }); 
          return;
        }

        res.status(200).json(updatedCart);
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ message: "Server error while removing item from cart.", error });
        return;
    }
  };

  clearCart = async (req: Request, res: Response) => {
    const firebaseUID = req.user?.uid;
    if (!firebaseUID) {
      res.status(401).json({ message: "Unauthorized." }); 
      return;
    }

    try {
        const mongoUser = await this.findMongoUser(firebaseUID);
        if (!mongoUser)
        { 
          res.status(401).json({ message: "User not found." }); 
          return;
        }
        const userId = mongoUser._id;

        const cart = await Cart.findOne({ userId });
        if (!cart)
        { 
          res.status(404).json({ message: "Cart not found." }); 
          return;
        }
        
        cart.items.splice(0, cart.items.length); 
        await cart.save();
        
        res.status(200).json({ message: "Cart cleared successfully", cart });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ message: "Server error while clearing cart.", error });
        return;
    }
  };
}

export default new CartController();
