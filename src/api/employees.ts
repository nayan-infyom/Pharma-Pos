import { apiGet, apiGetPaginated, apiPatch, apiPost, Pagination } from './client';
import { Employee, Permission } from '../types';

export interface ListEmployeesParams {
  search?: string;
  role?: Employee['role'];
  status?: Employee['status'];
  page?: number;
  limit?: number;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phone: string;
  role: Employee['role'];
  status?: Employee['status'];
  permissions?: Permission[];
  licenseNumber?: string;
  shiftTiming?: string;
  cashDrawerLimit?: number;
}

export type UpdateEmployeeRequest = Partial<CreateEmployeeRequest>;

export async function listEmployees(params: ListEmployeesParams = {}): Promise<{ items: Employee[]; pagination: Pagination }> {
  return apiGetPaginated<Employee>('/employees', { ...params });
}
export async function getEmployeeById(id: string): Promise<Employee> {
  return apiGet<Employee>(`/employees/${id}`);
}
export async function createEmployee(body: CreateEmployeeRequest): Promise<Employee> {
  return apiPost<Employee>('/employees', body);
}
export async function updateEmployee(id: string, updates: UpdateEmployeeRequest): Promise<Employee> {
  return apiPatch<Employee>(`/employees/${id}`, updates);
}
