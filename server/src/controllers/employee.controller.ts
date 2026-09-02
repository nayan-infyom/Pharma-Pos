import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendPaginated, sendSuccess } from '../utils/response';
import * as employeeService from '../services/employeeService';
import { CreateEmployeeBody, ListEmployeesQuery, UpdateEmployeeBody } from '../validators/employee.validators';

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = req.validated!.query as ListEmployeesQuery;
  const { items, pagination } = await employeeService.listEmployees(query);
  sendPaginated(res, items, pagination);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  const employee = await employeeService.getEmployeeById(id);
  sendSuccess(res, employee);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const employee = await employeeService.createEmployee(req.body as CreateEmployeeBody);
  sendSuccess(res, employee, 201);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.validated!.params as { id: string };
  const employee = await employeeService.updateEmployee(id, req.body as UpdateEmployeeBody);
  sendSuccess(res, employee);
});
