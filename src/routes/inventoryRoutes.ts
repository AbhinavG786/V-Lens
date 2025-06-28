import inventory from '../controllers/inventoryController';
import { Router } from 'express';

const router = Router();

router.post('/inventory', inventory.createInventoryItem);
router.get('/inventory', inventory.getAllInventoryItems);
router.get('/inventory/:id', inventory.getInventoryItemById);
router.put('/inventory/:id', inventory.updateInventoryItemById);
router.delete('/inventory/:id', inventory.deleteInventoryItemById);

export default router;