import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDB, connectTestDB, disconnectTestDB } from '../test/setupMemoryDb';
import { authedUser } from '../test/authHelpers';
import { createApp } from '../app';

beforeAll(connectTestDB, 60000);
afterEach(clearTestDB);
afterAll(disconnectTestDB, 30000);

function cartItem(overrides: Record<string, unknown> = {}) {
  return {
    medicineId: '64b0000000000000000000aa',
    medicineName: 'Paracetamol 500mg',
    batchId: '64b0000000000000000000bb',
    batchNumber: 'PCM-A1',
    expiryDate: '2028-01-01',
    availableBatchStock: 100,
    quantity: 2,
    purchasePrice: 12,
    mrp: 25,
    unitPrice: 22,
    taxRate: 12,
    taxAmount: 4.71,
    subtotal: 44,
    total: 48.71,
    ...overrides
  };
}

function baseHeldSale(overrides: Record<string, unknown> = {}) {
  return {
    name: "Walk-in Customer's Cart",
    items: [cartItem()],
    subtotal: 44,
    taxTotal: 4.71,
    grandTotal: 49,
    ...overrides
  };
}

describe('Held sale CRUD', () => {
  it('holds a cart, scoped to the authenticated cashier', async () => {
    const app = createApp();
    const { token } = await authedUser(app);

    const res = await request(app).post('/api/held-sales').set('Authorization', `Bearer ${token}`).send(baseHeldSale());

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Walk-in Customer's Cart");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.grandTotal).toBe(49);
  });

  it('lists only the current cashier held sales, newest first', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    await request(app).post('/api/held-sales').set('Authorization', `Bearer ${token}`).send(baseHeldSale({ name: 'First' }));
    await request(app).post('/api/held-sales').set('Authorization', `Bearer ${token}`).send(baseHeldSale({ name: 'Second' }));

    const res = await request(app).get('/api/held-sales').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe('Second');
  });

  it('gets a single held sale by id with full item detail (resume)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const created = await request(app).post('/api/held-sales').set('Authorization', `Bearer ${token}`).send(baseHeldSale());

    const res = await request(app).get(`/api/held-sales/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].medicineName).toBe('Paracetamol 500mg');
    expect(res.body.data.items[0].quantity).toBe(2);
  });

  it('deletes a held sale, and deleting/getting again 404s', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const created = await request(app).post('/api/held-sales').set('Authorization', `Bearer ${token}`).send(baseHeldSale());

    const del = await request(app).delete(`/api/held-sales/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const getAgain = await request(app).get(`/api/held-sales/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(getAgain.status).toBe(404);
  });

  it('rejects an empty items array', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const res = await request(app).post('/api/held-sales').set('Authorization', `Bearer ${token}`).send(baseHeldSale({ items: [] }));
    expect(res.status).toBe(400);
  });
});

describe('Ownership / data isolation', () => {
  it('does not let a different cashier list, view, or delete another cashier held sale', async () => {
    const app = createApp();
    const cashierA = await authedUser(app);
    const cashierB = await authedUser(app);

    const created = await request(app).post('/api/held-sales').set('Authorization', `Bearer ${cashierA.token}`).send(baseHeldSale());
    const heldId = created.body.data.id;

    const listB = await request(app).get('/api/held-sales').set('Authorization', `Bearer ${cashierB.token}`);
    expect(listB.body.data.find((h: { id: string }) => h.id === heldId)).toBeUndefined();

    const getB = await request(app).get(`/api/held-sales/${heldId}`).set('Authorization', `Bearer ${cashierB.token}`);
    expect(getB.status).toBe(404);

    const delB = await request(app).delete(`/api/held-sales/${heldId}`).set('Authorization', `Bearer ${cashierB.token}`);
    expect(delB.status).toBe(404);

    // Still there for its actual owner, proving B's failed delete had no effect.
    const getA = await request(app).get(`/api/held-sales/${heldId}`).set('Authorization', `Bearer ${cashierA.token}`);
    expect(getA.status).toBe(200);
  });
});

describe('Authorization / RBAC', () => {
  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    const res = await request(app).get('/api/held-sales');
    expect(res.status).toBe(401);
  });

  it('rejects an Inventory Specialist (lacks create_sale)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, {
      role: 'Inventory Specialist',
      permissions: ['view_inventory', 'adjust_inventory', 'manage_medicines', 'manage_purchases']
    });
    const res = await request(app).post('/api/held-sales').set('Authorization', `Bearer ${token}`).send(baseHeldSale());
    expect(res.status).toBe(403);
  });
});
