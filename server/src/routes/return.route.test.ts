import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDB, connectTestDB, disconnectTestDB } from '../test/setupMemoryDb';
import { authedUser } from '../test/authHelpers';
import { createApp } from '../app';
import { Medicine } from '../models/Medicine.model';
import { Supplier } from '../models/Supplier.model';
import { Customer } from '../models/Customer.model';
import { CustomerLedgerEntry } from '../models/CustomerLedgerEntry.model';
import { SupplierLedgerEntry } from '../models/SupplierLedgerEntry.model';
import { StockMovement } from '../models/StockMovement.model';
import { SalesReturn } from '../models/SalesReturn.model';

function randomKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

beforeAll(connectTestDB, 60000);
afterEach(clearTestDB);
afterAll(disconnectTestDB, 30000);

async function seedMedicine(overrides: { sellingPrice?: number; quantity?: number } = {}) {
  const supplier = await Supplier.create({ name: 'Acme', phone: '9800000001' });
  const sellingPrice = overrides.sellingPrice ?? 100;
  return Medicine.create({
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Clavulanic Acid',
    brand: 'GSK',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    strength: '625 mg',
    packSize: '10 Tablets / Strip',
    barcode: `BC-${Date.now()}-${Math.random()}`,
    purchasePrice: 50,
    mrp: sellingPrice + 30,
    sellingPrice,
    gstRate: 12,
    reorderLevel: 10,
    batches: [
      {
        batchNumber: 'B1',
        supplierId: supplier._id,
        supplierName: supplier.name,
        quantity: overrides.quantity ?? 100,
        purchasePrice: 50,
        mrp: sellingPrice + 30,
        sellingPrice,
        mfgDate: new Date('2024-01-01'),
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000)
      }
    ]
  });
}

async function makeSale(
  app: import('express').Express,
  token: string,
  medicineId: string,
  quantity: number,
  customerId?: string
) {
  const res = await request(app)
    .post('/api/sales')
    .set('Authorization', `Bearer ${token}`)
    .send({
      items: [{ medicineId, quantity }],
      customerId,
      paymentMethod: customerId ? 'Credit' : 'Cash',
      amountPaid: customerId ? 0 : 100000,
      idempotencyKey: randomKey()
    });
  if (res.status !== 201) throw new Error(`sale setup failed: ${JSON.stringify(res.body)}`);
  return res.body.data;
}

describe('POST /api/returns/sales', () => {
  it('restocks the batch, logs a Return movement, and derives unitPrice/refundAmount from the original sale', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine({ sellingPrice: 100, quantity: 20 });
    const sale = await makeSale(app, token, med.id, 5);

    const res = await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalSaleId: sale.id,
        items: [{ medicineId: med.id, batchNumber: sale.items[0].batchNumber, returnQuantity: 2, reason: 'Patient Recovered' }],
        refundMethod: 'Cash'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.returnNumber).toMatch(/^SR-\d{4}-\d+$/);
    expect(res.body.data.items[0].unitPrice).toBe(100);
    expect(res.body.data.items[0].refundAmount).toBe(200);
    expect(res.body.data.totalRefundAmount).toBe(200);

    const reloadedMed = await Medicine.findById(med._id);
    expect(reloadedMed!.batches[0].quantity).toBe(17); // 20 - 5 sold + 2 returned

    const movements = await StockMovement.find({ referenceId: res.body.data.returnNumber });
    expect(movements.length).toBe(1);
    expect(movements[0].type).toBe('Return');
    expect(movements[0].quantityChange).toBe(2);
  });

  it('rejects a return quantity greater than what was originally sold on that line', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine({ quantity: 20 });
    const sale = await makeSale(app, token, med.id, 3);

    const res = await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalSaleId: sale.id,
        items: [{ medicineId: med.id, batchNumber: sale.items[0].batchNumber, returnQuantity: 10, reason: 'Other' }],
        refundMethod: 'Cash'
      });
    expect(res.status).toBe(400);
  });

  it('rejects a SECOND return once the cumulative returned quantity would exceed the original sale', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine({ quantity: 20 });
    const sale = await makeSale(app, token, med.id, 5);
    const batchNumber = sale.items[0].batchNumber;

    const first = await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalSaleId: sale.id, items: [{ medicineId: med.id, batchNumber, returnQuantity: 3, reason: 'Other' }], refundMethod: 'Cash' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalSaleId: sale.id, items: [{ medicineId: med.id, batchNumber, returnQuantity: 3, reason: 'Other' }], refundMethod: 'Cash' });
    // 3 already returned + 3 more = 6 > 5 sold
    expect(second.status).toBe(400);
  });

  it('rejects a medicine/batch that was not part of the original sale', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine({ quantity: 20 });
    const other = await seedMedicine({ quantity: 20 });
    const sale = await makeSale(app, token, med.id, 3);

    const res = await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalSaleId: sale.id,
        items: [{ medicineId: other.id, batchNumber: 'B1', returnQuantity: 1, reason: 'Other' }],
        refundMethod: 'Cash'
      });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a nonexistent original sale', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine();
    const res = await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalSaleId: '64b000000000000000000000',
        items: [{ medicineId: med.id, batchNumber: 'B1', returnQuantity: 1, reason: 'Other' }],
        refundMethod: 'Cash'
      });
    expect(res.status).toBe(404);
  });

  it('rolls back everything if one item in a multi-item return is invalid', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine({ quantity: 20 });
    const other = await seedMedicine({ quantity: 20 });
    const sale = await makeSale(app, token, med.id, 5);
    const batchNumber = sale.items[0].batchNumber;

    const res = await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalSaleId: sale.id,
        items: [
          { medicineId: med.id, batchNumber, returnQuantity: 2, reason: 'Other' },
          { medicineId: other.id, batchNumber: 'X', returnQuantity: 1, reason: 'Other' } // not on the sale — must fail
        ],
        refundMethod: 'Cash'
      });

    expect(res.status).toBe(400);
    const reloadedMed = await Medicine.findById(med._id);
    expect(reloadedMed!.batches[0].quantity).toBe(15); // 20 - 5 sold, untouched by the failed return
    expect(await SalesReturn.countDocuments({})).toBe(0);
  });

  describe('Credit Note refund -> Khata ledger', () => {
    it('decreases the customer outstanding balance and writes a ReturnCredit entry', async () => {
      const app = createApp();
      const { token } = await authedUser(app);
      const med = await seedMedicine({ sellingPrice: 100, quantity: 20 });
      const customer = await Customer.create({ name: 'Ramesh Kumar', phone: '9811111111', creditLimit: 10000 });
      const sale = await makeSale(app, token, med.id, 5, customer.id);

      const balanceAfterSale = (await Customer.findById(customer._id))!.outstandingBalance;
      expect(balanceAfterSale).toBe(sale.grandTotal);

      const res = await request(app)
        .post('/api/returns/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          originalSaleId: sale.id,
          items: [{ medicineId: med.id, batchNumber: sale.items[0].batchNumber, returnQuantity: 2, reason: 'Patient Recovered' }],
          refundMethod: 'Credit Note'
        });

      expect(res.status).toBe(201);
      const reloadedCustomer = await Customer.findById(customer._id);
      expect(reloadedCustomer!.outstandingBalance).toBe(balanceAfterSale - 200);

      const ledger = await CustomerLedgerEntry.find({ customerId: customer._id, type: 'ReturnCredit' });
      expect(ledger.length).toBe(1);
      expect(ledger[0].amount).toBe(-200);
    });

    it('writes no ledger entry when the customer already has a zero balance (floor, no negative/advance credit invented)', async () => {
      const app = createApp();
      const { token } = await authedUser(app);
      const med = await seedMedicine({ sellingPrice: 100, quantity: 20 });
      const customer = await Customer.create({ name: 'Sunita Sharma', phone: '9822222222', outstandingBalance: 0 });
      const sale = await makeSale(app, token, med.id, 5); // Cash sale, no Khata impact

      const res = await request(app)
        .post('/api/returns/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          originalSaleId: sale.id,
          items: [{ medicineId: med.id, batchNumber: sale.items[0].batchNumber, returnQuantity: 2, reason: 'Other' }],
          refundMethod: 'Cash'
        });
      expect(res.status).toBe(201);
      expect(await CustomerLedgerEntry.countDocuments({})).toBe(0);
    });
  });

  describe('Authorization / RBAC', () => {
    it('rejects unauthenticated requests', async () => {
      const app = createApp();
      const res = await request(app).get('/api/returns/sales');
      expect(res.status).toBe(401);
    });

    it('rejects a Cashier (lacks refund_sale)', async () => {
      const app = createApp();
      const { token } = await authedUser(app, { role: 'Cashier', permissions: ['view_pos', 'create_sale', 'view_inventory'] });
      const med = await seedMedicine();
      const res = await request(app)
        .post('/api/returns/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({ originalSaleId: '64b000000000000000000000', items: [{ medicineId: med.id, batchNumber: 'B1', returnQuantity: 1, reason: 'Other' }], refundMethod: 'Cash' });
      expect(res.status).toBe(403);
    });
  });
});

describe('POST /api/returns/purchases', () => {
  async function makePurchase(app: import('express').Express, token: string, medicineId: string, supplierId: string, quantity: number, paidAmount: number) {
    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplierId,
        invoiceNumber: `SUPINV-${randomKey()}`,
        items: [
          {
            medicineId,
            medicineName: 'Augmentin 625 Duo',
            batchNumber: 'PB-1',
            mfgDate: '2026-01-01',
            expiryDate: '2028-01-01',
            quantity,
            freeQuantity: 0,
            purchasePrice: 50,
            mrp: 130,
            sellingPrice: 100,
            taxRate: 12,
            discountPercent: 0
          }
        ],
        paidAmount,
        status: 'Received',
        idempotencyKey: randomKey()
      });
    if (res.status !== 201) throw new Error(`purchase setup failed: ${JSON.stringify(res.body)}`);
    return res.body.data;
  }

  it('deducts stock, logs a Return movement, and writes a PurchaseReturnDebit against the supplier payable', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const supplier = await Supplier.create({ name: 'Acme', phone: '9800000001' });
    const med = await Medicine.create({
      name: 'Test Med',
      genericName: 'Test Salt',
      brand: 'X',
      category: 'Antibiotics',
      dosageForm: 'Tablet',
      strength: '500 mg',
      packSize: '10',
      barcode: `BC-${Date.now()}`,
      purchasePrice: 50,
      mrp: 130,
      sellingPrice: 100,
      gstRate: 12,
      reorderLevel: 5,
      batches: []
    });

    const po = await makePurchase(app, token, med.id, supplier.id, 10, 0); // fully on credit -> supplier owed 100% of PO

    const res = await request(app)
      .post('/api/returns/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        purchaseOrderId: po.id,
        items: [{ medicineId: med.id, batchNumber: 'PB-1', quantity: 3, reason: 'Excess Stock' }]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].purchasePrice).toBe(50);
    expect(res.body.data.totalAmount).toBe(150);

    const reloadedMed = await Medicine.findById(med._id);
    expect(reloadedMed!.batches[0].quantity).toBe(7); // 10 received - 3 returned

    const movements = await StockMovement.find({ referenceId: res.body.data.returnNumber });
    expect(movements[0].type).toBe('Return');
    expect(movements[0].quantityChange).toBe(-3);

    const reloadedSupplier = await Supplier.findById(supplier._id);
    expect(reloadedSupplier!.outstandingAmount).toBe(po.grandTotal - 150);

    const ledger = await SupplierLedgerEntry.find({ supplierId: supplier._id, type: 'PurchaseReturnDebit' });
    expect(ledger.length).toBe(1);
    expect(ledger[0].amount).toBe(-150);
  });

  it('allows returning an already-expired batch (a documented return reason)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const supplier = await Supplier.create({ name: 'Acme', phone: '9800000001' });
    const med = await Medicine.create({
      name: 'Test Med',
      genericName: 'Test Salt',
      brand: 'X',
      category: 'Antibiotics',
      dosageForm: 'Tablet',
      strength: '500 mg',
      packSize: '10',
      barcode: `BC-${Date.now()}`,
      purchasePrice: 50,
      mrp: 130,
      sellingPrice: 100,
      gstRate: 12,
      reorderLevel: 5,
      batches: []
    });
    const po = await makePurchase(app, token, med.id, supplier.id, 10, 0);

    // Force the batch to be expired.
    await Medicine.updateOne({ _id: med._id }, { $set: { 'batches.$[b].expiryDate': new Date(Date.now() - 24 * 3600 * 1000) } }, { arrayFilters: [{ 'b.batchNumber': 'PB-1' }] });

    const res = await request(app)
      .post('/api/returns/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({ purchaseOrderId: po.id, items: [{ medicineId: med.id, batchNumber: 'PB-1', quantity: 5, reason: 'Near Expiry Received' }] });

    expect(res.status).toBe(201);
  });

  it('rejects a return quantity greater than originally received', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const supplier = await Supplier.create({ name: 'Acme', phone: '9800000001' });
    const med = await Medicine.create({
      name: 'Test Med',
      genericName: 'Test Salt',
      brand: 'X',
      category: 'Antibiotics',
      dosageForm: 'Tablet',
      strength: '500 mg',
      packSize: '10',
      barcode: `BC-${Date.now()}`,
      purchasePrice: 50,
      mrp: 130,
      sellingPrice: 100,
      gstRate: 12,
      reorderLevel: 5,
      batches: []
    });
    const po = await makePurchase(app, token, med.id, supplier.id, 5, 0);

    const res = await request(app)
      .post('/api/returns/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({ purchaseOrderId: po.id, items: [{ medicineId: med.id, batchNumber: 'PB-1', quantity: 10, reason: 'Excess Stock' }] });
    expect(res.status).toBe(400);
  });

  it('rejects a Cashier (lacks manage_purchases)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, { role: 'Cashier', permissions: ['view_pos', 'create_sale', 'view_inventory'] });
    const res = await request(app)
      .post('/api/returns/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({ purchaseOrderId: '64b000000000000000000000', items: [{ medicineId: '64b000000000000000000000', batchNumber: 'B1', quantity: 1, reason: 'Excess Stock' }] });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/returns (combined)', () => {
  it('lists both sales and purchase returns together, paginated', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const supplier = await Supplier.create({ name: 'Acme', phone: '9800000001' });
    const med = await seedMedicine({ quantity: 20 });

    const sale = await makeSale(app, token, med.id, 5);
    await request(app)
      .post('/api/returns/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ originalSaleId: sale.id, items: [{ medicineId: med.id, batchNumber: sale.items[0].batchNumber, returnQuantity: 1, reason: 'Other' }], refundMethod: 'Cash' });

    const po = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplierId: supplier.id,
        invoiceNumber: `SUPINV-${randomKey()}`,
        items: [
          {
            medicineId: med.id,
            medicineName: 'Augmentin 625 Duo',
            batchNumber: 'PB-2',
            mfgDate: '2026-01-01',
            expiryDate: '2028-01-01',
            quantity: 10,
            freeQuantity: 0,
            purchasePrice: 50,
            mrp: 130,
            sellingPrice: 100,
            taxRate: 12,
            discountPercent: 0
          }
        ],
        paidAmount: 0,
        status: 'Received',
        idempotencyKey: randomKey()
      });
    await request(app)
      .post('/api/returns/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({ purchaseOrderId: po.body.data.id, items: [{ medicineId: med.id, batchNumber: 'PB-2', quantity: 2, reason: 'Excess Stock' }] });

    const res = await request(app).get('/api/returns').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const types = res.body.data.map((r: { type: string }) => r.type).sort();
    expect(types).toEqual(['Purchase Return', 'Sales Return']);
  });

  it('rejects a role holding neither refund_sale nor manage_purchases', async () => {
    const app = createApp();
    const { token } = await authedUser(app, { role: 'Cashier', permissions: ['view_pos', 'create_sale', 'view_inventory'] });
    const res = await request(app).get('/api/returns').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
