import { Employee } from '../types';
import * as employeesApi from '../api/employees';
import { Pagination } from '../api/client';

/**
 * Phase K batch 5: backed by the real API — no parallel localStorage staff
 * directory. Creating/editing an Employee here manages the staff profile
 * only; it does not create or touch login credentials (see server-side
 * employee.validators.ts comment) — that remains a separate, not-yet-built
 * onboarding flow, matching the original frontend's scope exactly.
 */
class EmployeeService {
  /** Capped at the backend's max page size (100) — see medicineService's identical, already-flagged limitation. */
  async getAll(): Promise<Employee[]> {
    const { items } = await employeesApi.listEmployees({ limit: 100 });
    return items;
  }

  async list(params: employeesApi.ListEmployeesParams = {}): Promise<{ items: Employee[]; pagination: Pagination }> {
    return employeesApi.listEmployees(params);
  }

  async getById(id: string): Promise<Employee | undefined> {
    try {
      return await employeesApi.getEmployeeById(id);
    } catch {
      return undefined;
    }
  }

  async create(input: employeesApi.CreateEmployeeRequest): Promise<Employee> {
    return employeesApi.createEmployee(input);
  }

  async update(id: string, updates: employeesApi.UpdateEmployeeRequest): Promise<Employee> {
    return employeesApi.updateEmployee(id, updates);
  }
}

export const employeeService = new EmployeeService();
