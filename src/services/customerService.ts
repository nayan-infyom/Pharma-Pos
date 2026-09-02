import { Customer, CustomerLedgerEntry } from '../types';
import * as customersApi from '../api/customers';
import { Pagination } from '../api/client';

/**
 * Phase K batch 2: backed by the real API. Method names/signatures are
 * preserved where existing pages (GlobalSearchModal, PrescriptionsPage,
 * DashboardPage) already call them, so those keep compiling untouched;
 * new methods (list/getLedger) were added for the pages actually migrated
 * this batch (CustomersPage, POS CustomerSelectModal).
 */
export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  creditLimit?: number;
  notes?: string;
  allergies?: string[];
  chronicConditions?: string[];
  doctorName?: string;
}

class CustomerService {
  /** Capped at the backend's max page size (100) — see medicineService's identical, already-flagged limitation. */
  async getAll(): Promise<Customer[]> {
    const { items } = await customersApi.listCustomers({ limit: 100 });
    return items;
  }

  async list(params: customersApi.ListCustomersParams = {}): Promise<{ items: Customer[]; pagination: Pagination }> {
    return customersApi.listCustomers(params);
  }

  async getById(id: string): Promise<Customer | undefined> {
    try {
      return await customersApi.getCustomerById(id);
    } catch {
      return undefined;
    }
  }

  async search(query?: string): Promise<Customer[]> {
    const { items } = await customersApi.listCustomers({ search: query || undefined, limit: 100 });
    return items;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    return customersApi.createCustomer(input);
  }

  async update(id: string, updates: Partial<CreateCustomerInput>): Promise<Customer> {
    return customersApi.updateCustomer(id, updates);
  }

  async getLedger(id: string, page = 1, limit = 25): Promise<{ items: CustomerLedgerEntry[]; pagination: Pagination }> {
    return customersApi.getCustomerLedger(id, page, limit);
  }

  /**
   * Ledger-backed settlement (server writes a CustomerLedgerEntry and updates
   * outstandingBalance atomically — see server/src/services/customerService.ts).
   * `method` now actually reaches the server (the old localStorage version
   * silently dropped it — DashboardPage's Quick Settle modal collects a
   * method but never passed it through; fixed at that call site too).
   */
  async settleBalance(id: string, amount: number, method: 'Cash' | 'UPI' | 'Card' = 'Cash', reference?: string, notes?: string): Promise<Customer> {
    const { customer } = await customersApi.settleCustomerBalance(id, { amount, method, reference, notes });
    return customer;
  }
}

export const customerService = new CustomerService();
