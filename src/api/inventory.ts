import { apiGetPaginated, apiPost, Pagination } from './client';
import { StockMovement, StockAdjustment, ExpiryRadarItem, Medicine } from '../types';

export interface AdjustStockRequest {
  medicineId: string;
  batchId: string;
  adjustmentType: 'Add Stock' | 'Subtract Stock' | 'Set Stock (Audit)' | 'Mark Damaged' | 'Mark Expired';
  // Absolute target count for 'Set Stock (Audit)'; a positive delta for every other type.
  quantity: number;
  reason: string;
  notes?: string;
}

export interface ListMovementsParams {
  medicineId?: string;
  type?: StockMovement['type'];
  referenceId?: string;
  page?: number;
  limit?: number;
}

export async function adjustStock(input: AdjustStockRequest): Promise<StockMovement> {
  return apiPost<StockMovement>('/inventory/adjustments', input);
}

export async function listMovements(params: ListMovementsParams = {}): Promise<{ items: StockMovement[]; pagination: Pagination }> {
  return apiGetPaginated<StockMovement>('/inventory/movements', { ...params });
}

export async function listAdjustments(page = 1, limit = 25): Promise<{ items: StockAdjustment[]; pagination: Pagination }> {
  return apiGetPaginated<StockAdjustment>('/inventory/adjustments', { page, limit });
}

/** Item expiryDate normalized to YYYY-MM-DD, same reasoning as api/medicines.ts. */
function toDateOnly(value: string): string {
  return typeof value === 'string' && value.length > 10 ? value.slice(0, 10) : value;
}

export async function getExpiryRadar(
  tier: 'critical' | 'near' | 'watchlist' | 'all' = 'all',
  page = 1,
  limit = 50
): Promise<{ items: ExpiryRadarItem[]; pagination: Pagination }> {
  const { items, pagination } = await apiGetPaginated<ExpiryRadarItem>('/inventory/expiry-radar', { tier, page, limit });
  return { items: items.map((i) => ({ ...i, expiryDate: toDateOnly(i.expiryDate) })), pagination };
}

export async function getLowStock(page = 1, limit = 25): Promise<{ items: Medicine[]; pagination: Pagination }> {
  return apiGetPaginated<Medicine>('/inventory/low-stock', { page, limit });
}
