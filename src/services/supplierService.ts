import { Supplier, SupplierLedgerEntry } from '../types';
import * as suppliersApi from '../api/suppliers';
import { Pagination } from '../api/client';

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  drugLicense?: string;
  drugLicenseNumber?: string;
  creditDays?: number;
  status?: 'Active' | 'Inactive';
}

class SupplierService {
  /** Capped at the backend's max page size (100) — see medicineService's identical, already-flagged limitation. */
  async getAll(): Promise<Supplier[]> {
    const { items } = await suppliersApi.listSuppliers({ limit: 100 });
    return items;
  }

  async list(params: suppliersApi.ListSuppliersParams = {}): Promise<{ items: Supplier[]; pagination: Pagination }> {
    return suppliersApi.listSuppliers(params);
  }

  async getById(id: string): Promise<Supplier | undefined> {
    try {
      return await suppliersApi.getSupplierById(id);
    } catch {
      return undefined;
    }
  }

  async search(query?: string): Promise<Supplier[]> {
    const { items } = await suppliersApi.listSuppliers({ search: query || undefined, limit: 100 });
    return items;
  }

  async create(input: CreateSupplierInput): Promise<Supplier> {
    return suppliersApi.createSupplier(input);
  }

  async update(id: string, updates: Partial<CreateSupplierInput>): Promise<Supplier> {
    return suppliersApi.updateSupplier(id, updates);
  }

  async getLedger(id: string, page = 1, limit = 25): Promise<{ items: SupplierLedgerEntry[]; pagination: Pagination }> {
    return suppliersApi.getSupplierLedger(id, page, limit);
  }

  /** Ledger-backed disbursement — server writes a SupplierLedgerEntry and updates outstandingAmount atomically. */
  async payBalance(
    id: string,
    amount: number,
    method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' = 'Bank Transfer',
    reference?: string,
    notes?: string
  ): Promise<Supplier> {
    const { supplier } = await suppliersApi.paySupplierBalance(id, { amount, method, reference, notes });
    return supplier;
  }
}

export const supplierService = new SupplierService();
