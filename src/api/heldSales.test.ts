import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getHeldSaleById, holdSale, listHeldSales } from './heldSales';
import { setAccessToken } from './client';
import { CartItem } from '../types';

function jsonResponse(status: number, body: unknown): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

const RAW_ITEM = {
  medicineId: 'm1',
  medicineName: 'Paracetamol 500mg',
  batchId: 'b1',
  batchNumber: 'PCM-A1',
  expiryDate: '2028-08-31T18:30:00.000Z',
  availableBatchStock: 100,
  quantity: 2,
  purchasePrice: 12,
  mrp: 25,
  unitPrice: 22,
  discountPercent: 0,
  discountAmount: 0,
  taxRate: 12,
  taxAmount: 4.71,
  subtotal: 44,
  total: 48.71,
  prescriptionRequired: false
} as CartItem;

const RAW_RECORD = {
  id: 'hs1',
  name: "Walk-in Customer's Cart",
  heldAt: '2026-09-02T10:00:00.000Z',
  customerId: 'c1',
  customerSnapshot: { id: 'c1', name: 'Test Patient', phone: '9800000000' },
  items: [RAW_ITEM],
  subtotal: 44,
  discountPercent: 0,
  taxTotal: 4.71,
  grandTotal: 49
};

describe('src/api/heldSales', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('normalizes the customerSnapshot into a display-only partial Customer, and exposes customerId separately', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(201, { success: true, data: RAW_RECORD })));

    const result = await holdSale({ name: RAW_RECORD.name, items: [RAW_ITEM], subtotal: 44, taxTotal: 4.71, grandTotal: 49 });

    expect(result.customerId).toBe('c1');
    expect(result.customer?.name).toBe('Test Patient');
    // Snapshot-derived display fields are zeroed, not fabricated as real balances.
    expect(result.customer?.outstandingBalance).toBe(0);
  });

  it('truncates item expiryDate to YYYY-MM-DD, same as other list/detail reads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(200, { success: true, data: [RAW_RECORD], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } })
    ));

    const { items } = await listHeldSales();

    expect(items[0].items[0].expiryDate).toBe('2028-08-31');
  });

  it('gets a single held sale by id with full item detail for resuming', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: RAW_RECORD })));

    const result = await getHeldSaleById('hs1');

    expect(result.items).toHaveLength(1);
    expect(result.grandTotal).toBe(49);
  });

  it('leaves customer null when the backend record has no customerSnapshot (walk-in)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(201, { success: true, data: { ...RAW_RECORD, customerId: undefined, customerSnapshot: undefined } })
    ));

    const result = await holdSale({ name: 'Held Cart #1', items: [RAW_ITEM], subtotal: 44, taxTotal: 4.71, grandTotal: 49 });

    expect(result.customerId).toBeUndefined();
    expect(result.customer).toBeNull();
  });
});
