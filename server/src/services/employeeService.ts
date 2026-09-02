import { FilterQuery } from 'mongoose';
import { Employee, EmployeeDoc } from '../models/Employee.model';
import { AppError } from '../errors/AppError';
import { buildPagination, Pagination } from '../utils/response';
import { CreateEmployeeBody, ListEmployeesQuery, UpdateEmployeeBody } from '../validators/employee.validators';

function isDigitsOnly(value: string): boolean {
  return /^\+?\d+$/.test(value.trim());
}
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listEmployees(query: ListEmployeesQuery): Promise<{ items: EmployeeDoc[]; pagination: Pagination }> {
  const filter: FilterQuery<EmployeeDoc> = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  let sort: Record<string, 1 | -1> = { name: 1 };

  if (query.search) {
    const term = query.search.trim();
    if (isDigitsOnly(term)) {
      filter.phone = { $regex: '^' + escapeRegex(term) };
    } else {
      filter.$text = { $search: term };
      sort = { score: { $meta: 'textScore' } } as unknown as Record<string, 1 | -1>;
    }
  }

  const skip = (query.page - 1) * query.limit;
  const projection = filter.$text ? { score: { $meta: 'textScore' } } : undefined;

  const [items, total] = await Promise.all([
    Employee.find(filter, projection).sort(sort).skip(skip).limit(query.limit),
    Employee.countDocuments(filter)
  ]);

  return { items, pagination: buildPagination(query.page, query.limit, total) };
}

export async function getEmployeeById(id: string): Promise<EmployeeDoc> {
  const employee = await Employee.findById(id);
  if (!employee) throw AppError.notFound('Employee');
  return employee;
}

export async function createEmployee(body: CreateEmployeeBody): Promise<EmployeeDoc> {
  return Employee.create(body);
}

export async function updateEmployee(id: string, updates: UpdateEmployeeBody): Promise<EmployeeDoc> {
  const employee = await Employee.findById(id);
  if (!employee) throw AppError.notFound('Employee');
  Object.assign(employee, updates);
  await employee.save();
  return employee;
}
