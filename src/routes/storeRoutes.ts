import { Router } from 'express';
import store from '../controllers/storeController';
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from '../middlewares/adminAuth';

const router = Router();

router.post('/',adminAuth.verifyAdminSession, store.createStore);
router.get('/nearby', store.findNearby);
router.get('/all', paginationMiddleware(10,50), store.getAllStores);
router.get('/:id', store.getStoreById);
router.patch('/:id',adminAuth.verifyAdminSession, store.updateStore);
router.delete('/:id',adminAuth.verifyAdminSession, store.deleteStore);

export default router;
