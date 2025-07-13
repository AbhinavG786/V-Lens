import wishlist from "../controllers/wishlistController";
import { Router } from "express";
import paginationMiddleware from "../middlewares/paginationMiddleware";
import firebaseAuth from "../middlewares/firebaseAuth";

const router = Router();

// Add product to wishlist
router.route("/add").post(firebaseAuth.verifySessionCookie, wishlist.addToWishlist);

// Get user's wishlist (with optional filters)
router.route("/user").get(firebaseAuth.verifySessionCookie, paginationMiddleware(10, 50), wishlist.getUserWishlist);

// Remove product from wishlist
router.route("/product/:productId").delete(firebaseAuth.verifySessionCookie, wishlist.removeFromWishlist);

// Update wishlist item (toggle favorite, update source)
router.route("/product/:productId").put(firebaseAuth.verifySessionCookie, wishlist.updateWishlistItem);

// Check if product is in user's wishlist
router.route("/product/:productId/status").get(firebaseAuth.verifySessionCookie, wishlist.checkWishlistStatus);

// Clear entire wishlist for a user (with optional source filter)
router.route("/clear").delete(firebaseAuth.verifySessionCookie, wishlist.clearWishlist);

// Get wishlist count for a user (with optional filters)
router.route("/count").get(firebaseAuth.verifySessionCookie, wishlist.getWishlistCount);

// Get analytics data (admin endpoint)
router.route("/analytics").get(wishlist.getWishlistAnalytics);

export default router; 