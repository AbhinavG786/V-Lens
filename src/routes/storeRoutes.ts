import { Router } from 'express';
import { findNearby } from '../controllers/storeController';
import paginationMiddleware from "../middlewares/paginationMiddleware";
const router = Router();

router.get('/stores/nearby', findNearby);

router.route("/user/:userId").get(paginationMiddleware(10, 50), wishlist.getUserWishlist);

export default router;
