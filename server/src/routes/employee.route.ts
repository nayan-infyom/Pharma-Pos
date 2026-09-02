import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/employee.controller';
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema
} from '../validators/employee.validators';

/**
 * manage_employees is an exact existing-permission fit. Every endpoint here
 * (including reads) is gated behind it rather than a lighter view_* bar,
 * because the roster response includes each employee's real permissions[]
 * array — that's sensitive enough to keep restricted to the same roles that
 * can already edit it (Admin / Chief Pharmacist per seed data), not opened
 * up to every authenticated role the way medicines/customers reads are.
 */
export const employeeRouter = Router();

employeeRouter.use(requireAuth);
employeeRouter.use(requirePermission('manage_employees'));

employeeRouter.get('/', validate(listEmployeesQuerySchema), controller.list);
employeeRouter.get('/:id', validate(employeeIdParamSchema), controller.getById);
employeeRouter.post('/', validate(createEmployeeSchema), controller.create);
employeeRouter.patch('/:id', validate(updateEmployeeSchema), controller.update);
