import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/expense.controller';
import { createExpenseSchema, expenseIdParamSchema, listExpensesQuerySchema } from '../validators/expense.validators';

/**
 * Permission gap (third instance of this category — see customer.route.ts
 * Phase G, prescription.route.ts Phase I): no dedicated expense permission
 * exists. PRODUCT_SPEC.md names "Store Owner, Cashier" as primary users;
 * reuses create_sale for the same reason as those two — Cashier is the
 * consistently-named counter-staff user across every gapped domain.
 */
export const expenseRouter = Router();

expenseRouter.use(requireAuth);
expenseRouter.use(requirePermission('create_sale'));

expenseRouter.get('/', validate(listExpensesQuerySchema), controller.list);
expenseRouter.post('/', validate(createExpenseSchema), controller.create);
expenseRouter.delete('/:id', validate(expenseIdParamSchema), controller.remove);
