import { Router } from 'express';
import store from '../controllers/storeController';
import paginationMiddleware from "../middlewares/paginationMiddleware";
import adminAuth from '../middlewares/adminAuth';
import adminStoreAuth from '../middlewares/adminStoreAuth';

const router = Router();

router.post('/',adminAuth.verifyAdminSession, store.createStore);
router.post('/store-manager',adminAuth.verifyAdminSession, store.createStoreManager);
router.post('/assign-store',adminAuth.verifyAdminSession, store.assignStoreManager);
router.post('/offline-order',adminStoreAuth.verifyAdminAndStoreSession,store.createOfflineOrder)
router.get('/nearby', store.findNearby);
router.get('/all', paginationMiddleware(10,50), store.getAllStores);
router.get('/store-manager/:userId',adminStoreAuth.verifyAdminAndStoreSession , store.fetchStoreAndWarehousesForManager);
router.get('/all-store-managers', adminAuth.verifyAdminSession,paginationMiddleware(10, 50), store.getAllStoreManagers);
router.get('/filter-city', paginationMiddleware(10, 50), store.filterStoresByCity);
router.get('/filter-state', paginationMiddleware(10, 50), store.filterStoresByState);
router.get('/:id', store.getStoreById);
router.patch('/:id',adminAuth.verifyAdminSession, store.updateStore);
router.delete('/store-manager/:userId',adminAuth.verifyAdminSession, store.deleteStoreManagerById);
router.delete('/:id',adminAuth.verifyAdminSession, store.deleteStore);

export default router;
