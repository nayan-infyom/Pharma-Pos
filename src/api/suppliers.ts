import { apiGet, apiGetPaginated, apiPatch, apiPost, Pagination } from './client';
import { Supplier, SupplierLedgerEntry } from '../types';

export interface ListSuppliersParams {
  search?: string;
  status?: 'Active' | 'Inactive';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'outstandingAmount' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface CreateSupplierRequest {
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

export interface PaySupplierRequest {
  amount: number;
  method?: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  reference?: string;
  notes?: string;
}

export async function listSuppliers(params: ListSuppliersParams = {}): Promise<{ items: Supplier[]; pagination: Pagination }> {
  return apiGetPaginated<Supplier>('/suppliers', { ...params });
}
export async function getSupplierById(id: string): Promise<Supplier> {
  return apiGet<Supplier>(`/suppliers/${id}`);
}
export async function createSupplier(body: CreateSupplierRequest): Promise<Supplier> {
  return apiPost<Supplier>('/suppliers', body);
}
export async function updateSupplier(id: string, updates: Partial<CreateSupplierRequest>): Promise<Supplier> {
  return apiPatch<Supplier>(`/suppliers/${id}`, updates);
}
export async function getSupplierLedger(id: string, page = 1, limit = 25): Promise<{ items: SupplierLedgerEntry[]; pagination: Pagination }> {
  return apiGetPaginated<SupplierLedgerEntry>(`/suppliers/${id}/ledger`, { page, limit });
}
export async function paySupplierBalance(id: string, body: PaySupplierRequest): Promise<{ supplier: Supplier; ledgerEntry: SupplierLedgerEntry }> {
  return apiPost(`/suppliers/${id}/pay`, body);
}
