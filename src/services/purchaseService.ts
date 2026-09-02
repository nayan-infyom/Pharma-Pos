import { PurchaseOrder } from '../types';
import * as purchasesApi from '../api/purchases';
import { Pagination } from '../api/client';

/**
 * Payload shape changed materially here, same category of change as
 * salesService.createSale (Phase K checkpoint): the old create() took an
 * ALREADY-FULLY-PRICED PurchaseOrder (taxAmount/total per line, subtotal/
 * taxTotal/grandTotal precomputed client-side, plus the dropped 92%-of-MRP
 * auto-margin default for sellingPrice) and just persisted it + mutated
 * stock as a side effect via medicineService.addStock/addBatch. The backend
 * now computes all pricing itself (resolved decision #2: no hardcoded
 * margin — sellingPrice is a required, explicit per-batch input) and
 * resolves stock/ledger/movement writes inside one transaction. This is a
 * genuine frontend/backend contract change, not an internals-only adapter —
 * PurchasesPage's call site was updated accordingly (see batch report).
 */
export interface CreatePurchaseItemInput {
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

export interface CreatePurchaseInput {
  supplierId: string;
  invoiceNumber: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  items: CreatePurchaseItemInput[];
  paidAmount?: number;
  status?: 'Received' | 'Ordered' | 'Cancelled';
  notes?: string;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

class PurchaseService {
  /** Capped at the backend's max page size (100) — see medicineService's identical, already-flagged limitation. */
  async getAll(): Promise<PurchaseOrder[]> {
    const { items } = await purchasesApi.listPurchases({ limit: 100 });
    return items;
  }

  async list(params: purchasesApi.ListPurchasesParams = {}): Promise<{ items: PurchaseOrder[]; pagination: Pagination }> {
    return purchasesApi.listPurchases(params);
  }

  async getById(id: string): Promise<PurchaseOrder | undefined> {
    try {
      return await purchasesApi.getPurchaseById(id);
    } catch {
      return undefined;
    }
  }

  /** No dedicated lookup-by-invoice-number endpoint — same pattern/limitation as salesService.getByInvoiceNumber. */
  async getByInvoiceNumber(invNum: string): Promise<PurchaseOrder | undefined> {
    const { items } = await purchasesApi.listPurchases({ limit: 100 });
    return items.find((p) => p.invoiceNumber.toLowerCase() === invNum.toLowerCase());
  }

  async create(input: CreatePurchaseInput): Promise<PurchaseOrder> {
    return purchasesApi.createPurchase({ ...input, idempotencyKey: generateIdempotencyKey() });
  }
}

export const purchaseService = new PurchaseService();
