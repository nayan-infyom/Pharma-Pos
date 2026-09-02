import { Customer } from '../types';
import { initialCustomers } from '../data/customers';

const STORAGE_KEY = 'pharmapos_customers_v1';

class CustomerService {
  private customers: Customer[];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.customers = JSON.parse(saved);
      } catch (e) {
        this.customers = initialCustomers;
      }
    } else {
      this.customers = initialCustomers;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customers));
  }

  async getAll(): Promise<Customer[]> {
    return [...this.customers];
  }

  async getById(id: string): Promise<Customer | undefined> {
    return this.customers.find(c => c.id === id);
  }

  async search(query?: string): Promise<Customer[]> {
    const q = (query || '').toLowerCase().trim();
    if (!q) return this.customers;
    return this.customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }

  async create(customer: Omit<Customer, 'id' | 'totalPurchases' | 'lastVisit'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      totalPurchases: 0,
      lastVisit: new Date().toISOString().split('T')[0]
    };
    this.customers.unshift(newCustomer);
    this.persist();
    return newCustomer;
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    this.customers[index] = { ...this.customers[index], ...updates };
    this.persist();
    return this.customers[index];
  }

  async recordPurchase(id: string, amount: number, isCredit: boolean = false): Promise<void> {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return;

    customer.totalPurchases += amount;
    customer.lastVisit = new Date().toISOString().split('T')[0];
    customer.loyaltyPoints += Math.floor(amount / 100); // 1 point per $100

    if (isCredit) {
      customer.outstandingBalance += amount;
    }

    this.persist();
  }

  async updateBalance(id: string, amountChange: number): Promise<void> {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return;
    customer.outstandingBalance = Math.max(0, customer.outstandingBalance + amountChange);
    this.persist();
  }

  async settleBalance(id: string, amountReceived: number): Promise<Customer | null> {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return null;
    customer.outstandingBalance = Math.max(0, customer.outstandingBalance - amountReceived);
    this.persist();
    return customer;
  }
}

export const customerService = new CustomerService();
