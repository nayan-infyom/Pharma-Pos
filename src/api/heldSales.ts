import { apiDelete, apiGet, apiGetPaginated, apiPost, Pagination } from './client';
import { CartItem, HeldSale } from '../types';

export interface CreateHeldSaleRequest {
  name: string;
  customerId?: string;
  customerSnapshot?: { id: string; name: string; phone: string };
  items: CartItem[];
  subtotal: number;
  discountPercent?: number;
  taxTotal: number;
  grandTotal: number;
}

/** Backend response shape — customerSnapshot is a lightweight display echo,
 *  not the full Customer (see types/index.ts HeldSale doc comment). */
interface HeldSaleRecord {
  id: string;
  name: string;
  heldAt: string;
  customerId?: string;
  customerSnapshot?: { id: string; name: string; phone: string };
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  taxTotal: number;
  grandTotal: number;
}

function toDateOnlyItems(items: CartItem[]): CartItem[] {
  return items.map((i) => ({ ...i, expiryDate: typeof i.expiryDate === 'string' && i.expiryDate.length > 10 ? i.expiryDate.slice(0, 10) : i.expiryDate }));
}

function normalize(record: HeldSaleRecord): HeldSale {
  return {
    id: record.id,
    name: record.name,
    heldAt: record.heldAt,
    customerId: record.customerId,
    customer: record.customerSnapshot
      ? {
          id: record.customerSnapshot.id,
          name: record.customerSnapshot.name,
          phone: record.customerSnapshot.phone,
          loyaltyPoints: 0,
          creditLimit: 0,
          outstandingBalance: 0,
          totalPurchases: 0,
          lastVisit: ''
        }
      : null,
    items: toDateOnlyItems(record.items),
    subtotal: record.subtotal,
    discountPercent: record.discountPercent,
    taxTotal: record.taxTotal,
    grandTotal: record.grandTotal
  };
}

export async function holdSale(body: CreateHeldSaleRequest): Promise<HeldSale> {
  return normalize(await apiPost<HeldSaleRecord>('/held-sales', body));
}
export async function listHeldSales(page = 1, limit = 50): Promise<{ items: HeldSale[]; pagination: Pagination }> {
  const { items, pagination } = await apiGetPaginated<HeldSaleRecord>('/held-sales', { page, limit });
  return { items: items.map(normalize), pagination };
}
export async function getHeldSaleById(id: string): Promise<HeldSale> {
  return normalize(await apiGet<HeldSaleRecord>(`/held-sales/${id}`));
}
export async function deleteHeldSale(id: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/held-sales/${id}`);
}
