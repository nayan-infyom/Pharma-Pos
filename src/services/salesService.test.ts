import { describe, expect, it, vi, beforeEach } from 'vitest';

const createSaleMock = vi.fn().mockResolvedValue({ id: 'sale1', invoiceNumber: 'INV-1' });
vi.mock('../api/sales', () => ({
  createSale: (...args: unknown[]) => createSaleMock(...args)
}));

import { salesService } from './salesService';

describe('salesService.createSale customerId guard', () => {
  beforeEach(() => createSaleMock.mockClear());

  const baseInput = {
    items: [{ medicineId: 'm1', quantity: 1 }],
    paymentMethod: 'Cash' as const,
    amountPaid: 25
  };

  it('omits customerId for the legacy walk-in placeholder id (not a real ObjectId)', async () => {
    await salesService.createSale({ ...baseInput, customerId: 'cust-01' });
    expect(createSaleMock).toHaveBeenCalledTimes(1);
    expect(createSaleMock.mock.calls[0][0].customerId).toBeUndefined();
  });

  it('forwards a real 24-hex Mongo ObjectId customerId (registered customer)', async () => {
    const realId = '6a97fab2b91d9d835094fe6b';
    await salesService.createSale({ ...baseInput, customerId: realId, paymentMethod: 'Credit' });
    expect(createSaleMock.mock.calls[0][0].customerId).toBe(realId);
  });

  it("translates the legacy 'UPI/QR' payment method to the canonical 'UPI'", async () => {
    await salesService.createSale({ ...baseInput, paymentMethod: 'UPI/QR' });
    expect(createSaleMock.mock.calls[0][0].paymentMethod).toBe('UPI');
  });
});
