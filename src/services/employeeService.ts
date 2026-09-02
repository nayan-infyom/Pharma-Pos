import { Employee, Permission } from '../types';
import { initialEmployees } from '../data/employees';

const STORAGE_KEY = 'pharmapos_employees_v1';

class EmployeeService {
  private employees: Employee[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.employees = saved ? JSON.parse(saved) : initialEmployees;
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.employees));
  }

  async getAll(): Promise<Employee[]> {
    return [...this.employees];
  }

  async getById(id: string): Promise<Employee | undefined> {
    return this.employees.find(e => e.id === id);
  }

  async create(data: Omit<Employee, 'id' | 'lastActive' | 'joinedDate'>): Promise<Employee> {
    const newEmp: Employee = {
      ...data,
      id: `emp-${Date.now()}`,
      lastActive: 'Never',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    this.employees.push(newEmp);
    this.persist();
    return newEmp;
  }

  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Employee not found');
    this.employees[index] = { ...this.employees[index], ...updates };
    this.persist();
    return this.employees[index];
  }
}

export const employeeService = new EmployeeService();
