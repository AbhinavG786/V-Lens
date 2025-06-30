import { Router } from 'express';
import { findNearby } from '../controllers/storeController';
const router = Router();

router.get('/stores/nearby', findNearby);

export default router;
