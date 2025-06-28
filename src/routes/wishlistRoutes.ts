import wishlist from "../controllers/wishlistController";
import { Router } from "express";

const router = Router();

// Add product to wishlist
router.route("/add").post(wishlist.addToWishlist);

// Get user's wishlist (with optional filters)
router.route("/user/:userId").get(wishlist.getUserWishlist);

// Remove product from wishlist
router.route("/user/:userId/product/:productId").delete(wishlist.removeFromWishlist);

// Update wishlist item (toggle favorite, update source)
router.route("/user/:userId/product/:productId").put(wishlist.updateWishlistItem);

// Check if product is in user's wishlist
router.route("/user/:userId/product/:productId/status").get(wishlist.checkWishlistStatus);

// Clear entire wishlist for a user (with optional source filter)
router.route("/user/:userId/clear").delete(wishlist.clearWishlist);

// Get wishlist count for a user (with optional filters)
router.route("/user/:userId/count").get(wishlist.getWishlistCount);

// Get analytics data (admin endpoint)
router.route("/analytics").get(wishlist.getWishlistAnalytics);

export default router; 