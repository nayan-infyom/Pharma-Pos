import request from 'supertest';
import { Express } from 'express';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDB, connectTestDB, disconnectTestDB } from '../test/setupMemoryDb';
import { authedUser } from '../test/authHelpers';
import { createApp } from '../app';
import { Medicine } from '../models/Medicine.model';
import { Supplier } from '../models/Supplier.model';

function randomKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

beforeAll(connectTestDB, 60000);
afterEach(clearTestDB);
afterAll(disconnectTestDB, 30000);

async function seedMedicine(overrides: { sellingPrice?: number; purchasePrice?: number; category?: string; quantity?: number } = {}) {
  const supplier = await Supplier.create({ name: 'Acme', phone: '9800000001' });
  const sellingPrice = overrides.sellingPrice ?? 100;
  const purchasePrice = overrides.purchasePrice ?? 50;
  return Medicine.create({
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Clavulanic Acid',
    brand: 'GSK',
    category: overrides.category ?? 'Antibiotics',
    dosageForm: 'Tablet',
    strength: '625 mg',
    packSize: '10 Tablets / Strip',
    barcode: `BC-${Date.now()}-${Math.random()}`,
    purchasePrice,
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
        purchasePrice,
        mrp: sellingPrice + 30,
        sellingPrice,
        mfgDate: new Date('2024-01-01'),
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000)
      }
    ]
  });
}

async function makeSale(app: Express, token: string, medicineId: string, quantity: number, paymentMethod: 'Cash' | 'UPI' = 'Cash') {
  let amountPaid = 100000;
  if (paymentMethod !== 'Cash') {
    // UPI/Card/Bank Transfer require amountPaid to equal the grand total
    // exactly (Phase F rule) — quote first to learn the server-computed total.
    const quote = await request(app)
      .post('/api/sales/quote')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ medicineId, quantity }] });
    amountPaid = quote.body.data.grandTotal;
  }

  const res = await request(app)
    .post('/api/sales')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ medicineId, quantity }], paymentMethod, amountPaid, idempotencyKey: randomKey() });
  if (res.status !== 201) throw new Error(`sale setup failed: ${JSON.stringify(res.body)}`);
  return res.body.data;
}

describe('GET /api/reports/sales-summary', () => {
  it('computes gross/net sales, tax, and a payment-method breakdown from real sales', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine({ sellingPrice: 100 });

    const cashSale = await makeSale(app, token, med.id, 5, 'Cash'); // 500 + 60 tax = 560
    const upiSale = await makeSale(app, token, med.id, 3, 'UPI'); // 300 + 36 tax = 336

    const res = await request(app).get('/api/reports/sales-summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.grossSales).toBe(cashSale.grandTotal + upiSale.grandTotal);
    expect(res.body.data.grossSales).toBe(896);
    expect(res.body.data.totalDiscounts).toBe(0);
    expect(res.body.data.netSales).toBe(896);
    expect(res.body.data.taxTotal).toBe(96);
    expect(res.body.data.invoiceCount).toBe(2);

    const breakdown = res.body.data.paymentMethodBreakdown.sort((a: { method: string }, b: { method: string }) => a.method.localeCompare(b.method));
    expect(breakdown).toEqual([
      { method: 'Cash', total: 560, count: 1 },
      { method: 'UPI', total: 336, count: 1 }
    ]);
  });

  it('excludes sales outside the requested date range', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine();
    await makeSale(app, token, med.id, 2);

    const farFuture = new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString();
    const res = await request(app).get(`/api/reports/sales-summary?from=${farFuture}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.invoiceCount).toBe(0);
    expect(res.body.data.grossSales).toBe(0);
  });
});

describe('GET /api/reports/profit-loss', () => {
  it('computes real COGS from sale-item purchasePrice snapshots, not a flat estimate', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine({ sellingPrice: 100, purchasePrice: 50 });
    const sale = await makeSale(app, token, med.id, 5); // subtotal 500, tax 60, grandTotal 560

    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Rent', category: 'Rent', amount: 200, paymentMethod: 'Bank Transfer' });

    const res = await request(app).get('/api/reports/profit-loss').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.netSales).toBe(sale.grandTotal);
    expect(res.body.data.cogs).toBe(5 * 50); // real COGS: quantity * purchasePrice snapshot
    expect(res.body.data.grossProfit).toBe(sale.grandTotal - 250);
    expect(res.body.data.totalOperatingExpenses).toBe(200);
    expect(res.body.data.netOperatingIncome).toBe(sale.grandTotal - 250 - 200);
    expect(res.body.data.expenseBreakdown).toEqual([{ category: 'Rent', total: 200 }]);
  });
});

describe('GET /api/reports/gst', () => {
  it('nets output GST (sales) against input tax credit (purchases)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const supplier = await Supplier.create({ name: 'Acme', phone: '9800000001' });
    const med = await seedMedicine({ sellingPrice: 100 });
    const sale = await makeSale(app, token, med.id, 5); // taxTotal 60

    const po = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplierId: supplier.id,
        invoiceNumber: `SUPINV-${randomKey()}`,
        items: [
          {
            medicineId: med.id,
            medicineName: med.name,
            batchNumber: 'PB-1',
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
    expect(po.status).toBe(201); // po.taxTotal = 60

    const res = await request(app).get('/api/reports/gst').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalGstCollected).toBe(sale.taxTotal);
    expect(res.body.data.totalGstPaidOnPurchases).toBe(po.body.data.taxTotal);
    expect(res.body.data.netGstPayable).toBe(Math.max(0, sale.taxTotal - po.body.data.taxTotal));
  });
});

describe('GET /api/reports/category-distribution', () => {
  it('groups active-medicine stock by category', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    await seedMedicine({ category: 'Antibiotics', quantity: 40 });
    await seedMedicine({ category: 'Analgesics', quantity: 25 });

    const res = await request(app).get('/api/reports/category-distribution').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const map = Object.fromEntries(res.body.data.map((d: { category: string; totalStock: number }) => [d.category, d.totalStock]));
    expect(map['Antibiotics']).toBe(40);
    expect(map['Analgesics']).toBe(25);
  });
});

describe('GET /api/reports/top-medicines', () => {
  it('ranks medicines by real quantity sold, not the old idx%2 placeholder', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const medA = await seedMedicine({ category: 'Antibiotics' });
    const medB = await seedMedicine({ category: 'Analgesics' });
    await makeSale(app, token, medA.id, 5);
    await makeSale(app, token, medB.id, 2);

    const res = await request(app).get('/api/reports/top-medicines').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].medicineId).toBe(medA.id);
    expect(res.body.data[0].quantitySold).toBe(5);
    expect(res.body.data[1].medicineId).toBe(medB.id);
    expect(res.body.data[1].quantitySold).toBe(2);
  });
});

describe('GET /api/reports/monthly-trend', () => {
  it('includes the current month with real sales figures, and returns exactly the requested window length', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const med = await seedMedicine();
    const sale = await makeSale(app, token, med.id, 5);

    const res = await request(app).get('/api/reports/monthly-trend?months=3').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    const now = new Date();
    const currentMonthRow = res.body.data[res.body.data.length - 1];
    expect(currentMonthRow.year).toBe(now.getFullYear());
    expect(currentMonthRow.month).toBe(now.getMonth() + 1);
    expect(currentMonthRow.sales).toBe(sale.grandTotal);
  });
});

describe('Authorization / RBAC', () => {
  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    const res = await request(app).get('/api/reports/sales-summary');
    expect(res.status).toBe(401);
  });

  it('rejects a Cashier (lacks view_reports)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, { role: 'Cashier', permissions: ['view_pos', 'create_sale', 'view_inventory'] });
    const res = await request(app).get('/api/reports/sales-summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows a Chief Pharmacist (holds view_reports)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, {
      role: 'Chief Pharmacist',
      permissions: ['view_pos', 'create_sale', 'refund_sale', 'view_inventory', 'adjust_inventory', 'manage_medicines', 'manage_purchases', 'view_reports']
    });
    const res = await request(app).get('/api/reports/sales-summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
