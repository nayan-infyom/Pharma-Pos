import { apiGet, apiGetPaginated, apiPost, Pagination } from './client';
import { CombinedReturnRow, PurchaseReturn, PurchaseReturnReason, SalesReturn, SalesReturnReason } from '../types';

export interface CreateSalesReturnRequest {
  originalSaleId: string;
  items: { medicineId: string; batchNumber: string; returnQuantity: number; reason: SalesReturnReason }[];
  refundMethod: 'Cash' | 'Credit Note' | 'Original Payment';
  notes?: string;
}

export interface CreatePurchaseReturnRequest {
  purchaseOrderId: string;
  items: { medicineId: string; batchNumber: string; quantity: number; reason: PurchaseReturnReason }[];
  status?: 'Pending' | 'Approved' | 'Adjusted';
  notes?: string;
}

export async function listCombinedReturns(page = 1, limit = 25): Promise<{ items: CombinedReturnRow[]; pagination: Pagination }> {
  return apiGetPaginated<CombinedReturnRow>('/returns', { page, limit });
}

export async function createSalesReturn(body: CreateSalesReturnRequest): Promise<SalesReturn> {
  return apiPost<SalesReturn>('/returns/sales', body);
}
export async function listSalesReturns(page = 1, limit = 25): Promise<{ items: SalesReturn[]; pagination: Pagination }> {
  return apiGetPaginated<SalesReturn>('/returns/sales', { page, limit });
}
export async function getSalesReturnById(id: string): Promise<SalesReturn> {
  return apiGet<SalesReturn>(`/returns/sales/${id}`);
}

export async function createPurchaseReturn(body: CreatePurchaseReturnRequest): Promise<PurchaseReturn> {
  return apiPost<PurchaseReturn>('/returns/purchases', body);
}
export async function listPurchaseReturns(page = 1, limit = 25): Promise<{ items: PurchaseReturn[]; pagination: Pagination }> {
  return apiGetPaginated<PurchaseReturn>('/returns/purchases', { page, limit });
}
export async function getPurchaseReturnById(id: string): Promise<PurchaseReturn> {
  return apiGet<PurchaseReturn>(`/returns/purchases/${id}`);
}
