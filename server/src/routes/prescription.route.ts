import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/prescription.controller';
import {
  createPrescriptionSchema,
  listPrescriptionsQuerySchema,
  prescriptionIdParamSchema,
  updatePrescriptionStatusSchema
} from '../validators/prescription.validators';

/**
 * Permission gap (same category as customer.route.ts in Phase G): no
 * dedicated 'view_prescriptions'/'manage_prescriptions' exists in the seeded
 * Permission set. Reuses create_sale — prescriptions feed directly into POS
 * dispensing and are handled by the same counter-pharmacist trust boundary
 * as customers/sales. Correctly excludes Inventory Specialist. Flagged in
 * the Phase I report as a second instance of this deferred-permission
 * category, not silently decided.
 */
export const prescriptionRouter = Router();

prescriptionRouter.use(requireAuth);
prescriptionRouter.use(requirePermission('create_sale'));

prescriptionRouter.get('/', validate(listPrescriptionsQuerySchema), controller.list);
prescriptionRouter.get('/:id', validate(prescriptionIdParamSchema), controller.getById);
prescriptionRouter.post('/', validate(createPrescriptionSchema), controller.create);
prescriptionRouter.patch('/:id/status', validate(updatePrescriptionStatusSchema), controller.updateStatus);
