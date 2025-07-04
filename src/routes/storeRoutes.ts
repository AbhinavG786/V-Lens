import { Router } from 'express';
import { findNearby } from '../controllers/storeController';
import paginationMiddleware from "../middlewares/paginationMiddleware";
const router = Router();

router.get('/stores/nearby', findNearby);

export default router;
