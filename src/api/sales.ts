import { apiGet, apiGetPaginated, apiPost, Pagination } from './client';
import { SaleInvoice } from '../types';

export interface SaleLineInput {
  medicineId: string;
  quantity: number;
  discountPercent?: number;
}

export interface CreateSaleRequest {
  items: SaleLineInput[];
  customerId?: string;
  doctorName?: string;
  cartDiscountPercent?: number;
  paymentMethod: string;
  splitDetails?: { method: string; amount: number; reference?: string }[];
  amountPaid: number;
  notes?: string;
  idempotencyKey: string;
}

export interface SaleQuoteRequest {
  items: SaleLineInput[];
  doctorName?: string;
  cartDiscountPercent?: number;
}

export async function quoteSale(input: SaleQuoteRequest): Promise<{ grandTotal: number; subtotal: number; discountTotal: number; taxTotal: number; roundOff: number }> {
  return apiPost('/sales/quote', input);
}

export async function createSale(input: CreateSaleRequest): Promise<SaleInvoice> {
  return apiPost<SaleInvoice>('/sales', input);
}

export interface ListSalesParams {
  customerId?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function listSales(params: ListSalesParams = {}): Promise<{ items: SaleInvoice[]; pagination: Pagination }> {
  return apiGetPaginated<SaleInvoice>('/sales', { ...params });
}

export async function getSaleById(id: string): Promise<SaleInvoice> {
  return apiGet<SaleInvoice>(`/sales/${id}`);
}
