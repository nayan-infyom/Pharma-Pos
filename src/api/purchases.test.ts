import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPurchaseById, listPurchases } from './purchases';
import { setAccessToken } from './client';

function jsonResponse(body: unknown): Response {
  return { status: 200, ok: true, json: async () => body } as Response;
}

const RAW_ITEM = {
  medicineId: 'm1',
  medicineName: 'Paracetamol',
  batchNumber: 'B1',
  mfgDate: '2026-01-01T00:00:00.000Z',
  expiryDate: '2028-08-31T18:30:00.000Z',
  quantity: 10,
  freeQuantity: 0,
  purchasePrice: 12,
  mrp: 25,
  sellingPrice: 22,
  taxRate: 12,
  taxAmount: 26.4,
  discountPercent: 0,
  total: 146.4
};

const RAW_PO = {
  id: 'po1',
  invoiceNumber: 'PINV-1',
  supplierId: 's1',
  supplierName: 'Acme',
  orderDate: '2026-09-01T00:00:00.000Z',
  deliveryDate: '2026-09-01T00:00:00.000Z',
  items: [RAW_ITEM],
  subtotal: 120,
  taxTotal: 26.4,
  discountTotal: 0,
  grandTotal: 146.4,
  paymentStatus: 'Pending',
  paidAmount: 0,
  status: 'Received'
};

describe('src/api/purchases date normalization', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('truncates item mfgDate/expiryDate to YYYY-MM-DD on getPurchaseById', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: RAW_PO })));

    const po = await getPurchaseById('po1');

    expect(po.items[0].mfgDate).toBe('2026-01-01');
    expect(po.items[0].expiryDate).toBe('2028-08-31');
  });

  it('normalizes every item in a paginated listPurchases response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ success: true, data: [RAW_PO], pagination: { page: 1, limit: 25, total: 1, totalPages: 1 } })
      )
    );

    const { items } = await listPurchases();

    expect(items[0].items[0].expiryDate).toBe('2028-08-31');
  });
});
