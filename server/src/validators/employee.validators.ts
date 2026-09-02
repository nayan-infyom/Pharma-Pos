import { z } from 'zod';
import { objectIdSchema } from './medicine.validators';
import { EMPLOYEE_ROLES, EMPLOYEE_STATUSES, PERMISSIONS } from '../models/enums';

// Login credentials (email/password) are a separate concern — see
// User.model.ts / authService.ts. Creating an Employee here only creates a
// staff directory profile, not system access; that matches the original
// frontend's employeeService.create(), which never touched credentials
// either (there was no real auth before Phase D). Granting a new hire login
// access remains a separate, not-yet-built onboarding flow — not invented here.
const employeeBodyBase = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  role: z.enum(EMPLOYEE_ROLES),
  status: z.enum(EMPLOYEE_STATUSES).default('Active'),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
  licenseNumber: z.string().trim().optional(),
  shiftTiming: z.string().trim().optional(),
  cashDrawerLimit: z.number().min(0).optional(),
  avatarUrl: z.string().trim().optional()
});

export const createEmployeeSchema = z.object({ body: employeeBodyBase });
export const updateEmployeeSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: employeeBodyBase.partial()
});

export const employeeIdParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

export const listEmployeesQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    role: z.enum(EMPLOYEE_ROLES).optional(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
});

export type CreateEmployeeBody = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeBody = z.infer<typeof updateEmployeeSchema>['body'];
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>['query'];
