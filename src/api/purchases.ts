import { apiGet, apiGetPaginated, apiPost, Pagination } from './client';
import { PurchaseOrder } from '../types';

export interface PurchaseItemInput {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  freeQuantity?: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  taxRate: number;
  discountPercent?: number;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  invoiceNumber: string;
  orderDate?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  items: PurchaseItemInput[];
  paidAmount?: number;
  status?: 'Received' | 'Ordered' | 'Cancelled';
  notes?: string;
  idempotencyKey: string;
}

export interface ListPurchasesParams {
  supplierId?: string;
  status?: 'Received' | 'Ordered' | 'Cancelled';
  paymentStatus?: 'Paid' | 'Pending' | 'Partial';
  page?: number;
  limit?: number;
}

/** Item mfgDate/expiryDate are rendered raw (not through formatDate) in
 *  PurchasesPage's tables — normalize to YYYY-MM-DD at this boundary, same
 *  reasoning as api/medicines.ts's batch date normalization. */
function toDateOnly(value: string): string {
  return typeof value === 'string' && value.length > 10 ? value.slice(0, 10) : value;
}
function normalizePurchaseOrder(po: PurchaseOrder): PurchaseOrder {
  return { ...po, items: po.items.map((i) => ({ ...i, mfgDate: toDateOnly(i.mfgDate), expiryDate: toDateOnly(i.expiryDate) })) };
}

export async function createPurchase(input: CreatePurchaseRequest): Promise<PurchaseOrder> {
  return normalizePurchaseOrder(await apiPost<PurchaseOrder>('/purchases', input));
}
export async function listPurchases(params: ListPurchasesParams = {}): Promise<{ items: PurchaseOrder[]; pagination: Pagination }> {
  const { items, pagination } = await apiGetPaginated<PurchaseOrder>('/purchases', { ...params });
  return { items: items.map(normalizePurchaseOrder), pagination };
}
export async function getPurchaseById(id: string): Promise<PurchaseOrder> {
  return normalizePurchaseOrder(await apiGet<PurchaseOrder>(`/purchases/${id}`));
}
