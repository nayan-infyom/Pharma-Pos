import { apiGet, apiGetPaginated, apiPatch, apiPost, Pagination } from './client';
import { Customer, CustomerLedgerEntry } from '../types';

export interface ListCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'lastVisit' | 'outstandingBalance' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface CreateCustomerRequest {
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

export interface SettleBalanceRequest {
  amount: number;
  method?: 'Cash' | 'UPI' | 'Card';
  reference?: string;
  notes?: string;
}

export async function listCustomers(params: ListCustomersParams = {}): Promise<{ items: Customer[]; pagination: Pagination }> {
  return apiGetPaginated<Customer>('/customers', { ...params });
}
export async function getCustomerById(id: string): Promise<Customer> {
  return apiGet<Customer>(`/customers/${id}`);
}
export async function createCustomer(body: CreateCustomerRequest): Promise<Customer> {
  return apiPost<Customer>('/customers', body);
}
export async function updateCustomer(id: string, updates: Partial<CreateCustomerRequest>): Promise<Customer> {
  return apiPatch<Customer>(`/customers/${id}`, updates);
}
export async function getCustomerLedger(id: string, page = 1, limit = 25): Promise<{ items: CustomerLedgerEntry[]; pagination: Pagination }> {
  return apiGetPaginated<CustomerLedgerEntry>(`/customers/${id}/ledger`, { page, limit });
}
export async function settleCustomerBalance(id: string, body: SettleBalanceRequest): Promise<{ customer: Customer; ledgerEntry: CustomerLedgerEntry }> {
  return apiPost(`/customers/${id}/settle`, body);
}
