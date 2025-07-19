import inventory from '../controllers/inventoryController';
import { Router } from 'express';
import adminAuth from '../middlewares/adminAuth';

const router = Router();

router.get('/inventory/all',adminAuth.verifyAdminSession, inventory.getAllInventoryItems);
router.get('/inventory/single-item/:warehouseId',adminAuth.verifyAdminSession,inventory.getEachProductStockInWarehouse)
router.get('/inventory/type/:warehouseId',adminAuth.verifyAdminSession,inventory.getAllProductStocksByTypeInWarehouse)
router.get('/inventory/total/:productId',adminAuth.verifyAdminSession,inventory.getTotalStockForProduct)
router.get('/inventory/:id',adminAuth.verifyAdminSession, inventory.getInventoryItemById);
router.patch('/inventory/:productId/:warehouseId',adminAuth.verifyAdminSession, inventory.updateInventoryItem);
router.delete('/inventory/:productId/:warehouseId',adminAuth.verifyAdminSession, inventory.deleteInventoryItem);


export default router;