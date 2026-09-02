import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPurchaseReturn, createSalesReturn } from './returns';
import { setAccessToken } from './client';

function jsonResponse(body: unknown): Response {
  return { status: 201, ok: true, json: async () => body } as Response;
}

describe('src/api/returns request shape', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('posts a sales return with only medicineId/batchNumber/returnQuantity/reason per item — no client-computed refundAmount', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { id: 'sr1', returnNumber: 'SR-2026-1' } }));
    vi.stubGlobal('fetch', fetchMock);

    await createSalesReturn({
      originalSaleId: 'sale1',
      items: [{ medicineId: 'm1', batchNumber: 'B1', returnQuantity: 2, reason: 'Patient Recovered' }],
      refundMethod: 'Cash'
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.items[0]).toEqual({ medicineId: 'm1', batchNumber: 'B1', returnQuantity: 2, reason: 'Patient Recovered' });
    expect(body.items[0].refundAmount).toBeUndefined();
    expect(body.originalSaleId).toBe('sale1');
  });

  it('posts a purchase return with only medicineId/batchNumber/quantity/reason per item — no client-computed totalAmount', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { id: 'pr1', returnNumber: 'PR-2026-1' } }));
    vi.stubGlobal('fetch', fetchMock);

    await createPurchaseReturn({
      purchaseOrderId: 'po1',
      items: [{ medicineId: 'm1', batchNumber: 'B1', quantity: 5, reason: 'Excess Stock' }],
      status: 'Approved'
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.items[0]).toEqual({ medicineId: 'm1', batchNumber: 'B1', quantity: 5, reason: 'Excess Stock' });
    expect(body.items[0].totalAmount).toBeUndefined();
    expect(body.purchaseOrderId).toBe('po1');
  });
});
