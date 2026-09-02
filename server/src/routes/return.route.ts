import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAnyPermission, requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/return.controller';
import {
  createPurchaseReturnSchema,
  createSalesReturnSchema,
  listReturnsQuerySchema,
  returnIdParamSchema
} from '../validators/return.validators';

export const returnRouter = Router();

returnRouter.use(requireAuth);

// Combined dashboard view serves both audiences — refund_sale (sales
// returns) and manage_purchases (purchase returns) holders.
returnRouter.get('/', requireAnyPermission('refund_sale', 'manage_purchases'), validate(listReturnsQuerySchema), controller.listCombined);

// refund_sale is an exact existing-permission fit (held by Admin/Chief
// Pharmacist, not Cashier — refunds require pharmacist-level authorization,
// matching real pharmacy policy already encoded in the seeded permissions).
returnRouter.post('/sales', requirePermission('refund_sale'), validate(createSalesReturnSchema), controller.createSalesReturn);
returnRouter.get('/sales', requirePermission('refund_sale'), validate(listReturnsQuerySchema), controller.listSalesReturns);
returnRouter.get('/sales/:id', requirePermission('refund_sale'), validate(returnIdParamSchema), controller.getSalesReturnById);

// manage_purchases matches Phase H's supplier/purchase domain exactly.
returnRouter.post('/purchases', requirePermission('manage_purchases'), validate(createPurchaseReturnSchema), controller.createPurchaseReturn);
returnRouter.get('/purchases', requirePermission('manage_purchases'), validate(listReturnsQuerySchema), controller.listPurchaseReturns);
returnRouter.get('/purchases/:id', requirePermission('manage_purchases'), validate(returnIdParamSchema), controller.getPurchaseReturnById);
