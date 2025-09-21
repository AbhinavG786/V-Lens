import inventory from '../controllers/inventoryController';
import { Router } from 'express';
import adminAuth from '../middlewares/adminAuth';
import adminWarehouseAuth from '../middlewares/adminWarehouseAuth';

const router = Router();

router.get('/inventory/all',adminAuth.verifyAdminSession, inventory.getAllInventoryItems);
router.get('/inventory/single-item/:warehouseId',adminWarehouseAuth.verifyAdminAndWarehouseSession,inventory.getEachProductStockInWarehouse)
router.get('/inventory/type/:warehouseId',adminWarehouseAuth.verifyAdminAndWarehouseSession,inventory.getAllProductStocksByTypeInWarehouse)
router.get('/inventory/total/:productId',adminAuth.verifyAdminSession,inventory.getTotalStockForProduct)
router.get('/inventory/:id',adminWarehouseAuth.verifyAdminAndWarehouseSession, inventory.getInventoryItemById);
router.patch('/inventory/:productId/:warehouseId',adminWarehouseAuth.verifyAdminAndWarehouseSession, inventory.updateInventoryItem);
router.delete('/inventory/:productId/:warehouseId',adminWarehouseAuth.verifyAdminAndWarehouseSession, inventory.deleteInventoryItem);


export default router;