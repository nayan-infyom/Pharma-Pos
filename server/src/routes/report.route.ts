import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/report.controller';
import { dateRangeQuerySchema, monthlyTrendQuerySchema, topMedicinesQuerySchema } from '../validators/report.validators';

// view_reports is an exact existing-permission fit — held by Admin and Chief
// Pharmacist, matching PRODUCT_SPEC's stated "Store Owner, Financial
// Auditor" users. No gap here (unlike expenses/customers/prescriptions).
export const reportRouter = Router();

reportRouter.use(requireAuth);
reportRouter.use(requirePermission('view_reports'));

reportRouter.get('/sales-summary', validate(dateRangeQuerySchema), controller.salesSummary);
reportRouter.get('/profit-loss', validate(dateRangeQuerySchema), controller.profitAndLoss);
reportRouter.get('/gst', validate(dateRangeQuerySchema), controller.gst);
reportRouter.get('/category-distribution', controller.categoryDistribution);
reportRouter.get('/monthly-trend', validate(monthlyTrendQuerySchema), controller.monthlyTrend);
reportRouter.get('/top-medicines', validate(topMedicinesQuerySchema), controller.topMedicines);
