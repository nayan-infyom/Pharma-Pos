import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CartItem, Customer, HeldSale } from '../types';

const holdMock = vi.fn();
const removeMock = vi.fn().mockResolvedValue(undefined);
const listMock = vi.fn();
vi.mock('../services/heldSalesService', () => ({
  heldSalesService: {
    hold: (...args: unknown[]) => holdMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
    list: (...args: unknown[]) => listMock(...args)
  }
}));

const getByIdMock = vi.fn();
vi.mock('../services/customerService', () => ({
  customerService: { getById: (...args: unknown[]) => getByIdMock(...args) }
}));

import { usePOSStore } from './usePOSStore';

const WALK_IN: Customer = { id: 'cust-01', name: 'Walk-in Customer', phone: '9800000000', loyaltyPoints: 0, creditLimit: 0, outstandingBalance: 0, totalPurchases: 0, lastVisit: '' };
const REAL_CUSTOMER: Customer = { id: '6a97fab2b91d9d835094fe6b', name: 'Test Patient', phone: '9877766655', loyaltyPoints: 0, creditLimit: 0, outstandingBalance: 25, totalPurchases: 100, lastVisit: '' };

const ITEM: CartItem = {
  medicineId: 'm1', medicineName: 'Paracetamol', genericName: 'g', brand: 'b', dosageForm: 'Tablet', strength: '500mg', packSize: '10',
  batchId: 'b1', batchNumber: 'B1', expiryDate: '2028-01-01', availableBatchStock: 100, quantity: 1,
  purchasePrice: 12, mrp: 25, unitPrice: 22, discountPercent: 0, discountAmount: 0, taxRate: 12, taxAmount: 2.64, subtotal: 22, total: 24.64, prescriptionRequired: false
};

beforeEach(() => {
  holdMock.mockReset();
  removeMock.mockClear();
  listMock.mockReset();
  getByIdMock.mockReset();
  usePOSStore.setState({ cart: [], customer: WALK_IN, heldSales: [], cartDiscountPercent: 0 });
});

describe('usePOSStore.holdSale', () => {
  it('omits customerId/customerSnapshot for the walk-in placeholder (not a real customer)', async () => {
    usePOSStore.setState({ cart: [ITEM] });
    holdMock.mockResolvedValue({ id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', items: [ITEM], subtotal: 22, discountPercent: 0, taxTotal: 2.64, grandTotal: 25 } as HeldSale);

    await usePOSStore.getState().holdSale();

    expect(holdMock).toHaveBeenCalledTimes(1);
    const payload = holdMock.mock.calls[0][0];
    expect(payload.customerId).toBeUndefined();
    expect(payload.customerSnapshot).toBeUndefined();
  });

  it('includes customerId/customerSnapshot for a real (24-hex) customer', async () => {
    usePOSStore.setState({ cart: [ITEM], customer: REAL_CUSTOMER });
    holdMock.mockResolvedValue({ id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', items: [ITEM], subtotal: 22, discountPercent: 0, taxTotal: 2.64, grandTotal: 25 } as HeldSale);

    await usePOSStore.getState().holdSale();

    const payload = holdMock.mock.calls[0][0];
    expect(payload.customerId).toBe(REAL_CUSTOMER.id);
    expect(payload.customerSnapshot).toEqual({ id: REAL_CUSTOMER.id, name: REAL_CUSTOMER.name, phone: REAL_CUSTOMER.phone });
  });

  it('does nothing when the cart is empty', async () => {
    await usePOSStore.getState().holdSale();
    expect(holdMock).not.toHaveBeenCalled();
  });

  it('clears the cart and prepends the created held sale on success', async () => {
    usePOSStore.setState({ cart: [ITEM], doctorName: 'Dr. X', cartDiscountPercent: 5 });
    const created = { id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', items: [ITEM], subtotal: 22, discountPercent: 5, taxTotal: 2.64, grandTotal: 25 } as HeldSale;
    holdMock.mockResolvedValue(created);

    await usePOSStore.getState().holdSale();

    const state = usePOSStore.getState();
    expect(state.cart).toEqual([]);
    expect(state.doctorName).toBe('');
    expect(state.cartDiscountPercent).toBe(0);
    expect(state.heldSales[0]).toEqual(created);
  });
});

describe('usePOSStore.resumeSale', () => {
  it('re-fetches the current customer by id rather than trusting the held-sale snapshot', async () => {
    const held: HeldSale = { id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', customerId: REAL_CUSTOMER.id, customer: { ...REAL_CUSTOMER, outstandingBalance: 999 }, items: [ITEM], subtotal: 22, discountPercent: 0, taxTotal: 2.64, grandTotal: 25 };
    usePOSStore.setState({ heldSales: [held] });
    getByIdMock.mockResolvedValue(REAL_CUSTOMER); // fresh: outstandingBalance 25, not the stale 999 in the snapshot

    await usePOSStore.getState().resumeSale('hs1');

    expect(getByIdMock).toHaveBeenCalledWith(REAL_CUSTOMER.id);
    const state = usePOSStore.getState();
    expect(state.customer?.outstandingBalance).toBe(25);
    expect(state.cart).toEqual([ITEM]);
  });

  it('removes the held sale from local state and deletes it server-side on resume', async () => {
    const held: HeldSale = { id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', items: [ITEM], subtotal: 22, discountPercent: 0, taxTotal: 2.64, grandTotal: 25 };
    usePOSStore.setState({ heldSales: [held] });

    await usePOSStore.getState().resumeSale('hs1');

    expect(usePOSStore.getState().heldSales).toEqual([]);
    expect(removeMock).toHaveBeenCalledWith('hs1');
  });

  it('does not fetch a customer for a walk-in held sale (no customerId)', async () => {
    const held: HeldSale = { id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', items: [ITEM], subtotal: 22, discountPercent: 0, taxTotal: 2.64, grandTotal: 25 };
    usePOSStore.setState({ heldSales: [held] });

    await usePOSStore.getState().resumeSale('hs1');

    expect(getByIdMock).not.toHaveBeenCalled();
    expect(usePOSStore.getState().customer).toBeNull();
  });
});

describe('usePOSStore.deleteHeldSale', () => {
  it('calls the delete API and removes the entry from local state', async () => {
    const held: HeldSale = { id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', items: [ITEM], subtotal: 22, discountPercent: 0, taxTotal: 2.64, grandTotal: 25 };
    usePOSStore.setState({ heldSales: [held] });

    await usePOSStore.getState().deleteHeldSale('hs1');

    expect(removeMock).toHaveBeenCalledWith('hs1');
    expect(usePOSStore.getState().heldSales).toEqual([]);
  });
});

describe('usePOSStore.loadHeldSales', () => {
  it('populates heldSales from the service and toggles isHeldSalesLoading', async () => {
    const held: HeldSale = { id: 'hs1', name: 'x', heldAt: '2026-09-02T10:00:00.000Z', items: [ITEM], subtotal: 22, discountPercent: 0, taxTotal: 2.64, grandTotal: 25 };
    listMock.mockResolvedValue([held]);

    const promise = usePOSStore.getState().loadHeldSales();
    expect(usePOSStore.getState().isHeldSalesLoading).toBe(true);
    await promise;

    expect(usePOSStore.getState().heldSales).toEqual([held]);
    expect(usePOSStore.getState().isHeldSalesLoading).toBe(false);
  });
});
