import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/heldSale.controller';
import { createHeldSaleSchema, heldSaleIdParamSchema, listHeldSalesQuerySchema } from '../validators/heldSale.validators';

// create_sale — same POS trust boundary as the rest of the checkout flow
// (park/resume is part of billing, not a separate privilege).
export const heldSaleRouter = Router();

heldSaleRouter.use(requireAuth);
heldSaleRouter.use(requirePermission('create_sale'));

heldSaleRouter.post('/', validate(createHeldSaleSchema), controller.hold);
heldSaleRouter.get('/', validate(listHeldSalesQuerySchema), controller.list);
heldSaleRouter.get('/:id', validate(heldSaleIdParamSchema), controller.getById);
heldSaleRouter.delete('/:id', validate(heldSaleIdParamSchema), controller.remove);
