import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDB, connectTestDB, disconnectTestDB } from '../test/setupMemoryDb';
import { authedUser } from '../test/authHelpers';
import { createApp } from '../app';
import { Expense } from '../models/Expense.model';

beforeAll(connectTestDB, 60000);
afterEach(clearTestDB);
afterAll(disconnectTestDB, 30000);

function baseExpense(overrides: Record<string, unknown> = {}) {
  return { title: 'Monthly Rent', category: 'Rent', amount: 15000, paymentMethod: 'Bank Transfer', ...overrides };
}

describe('Expense CRUD + validation', () => {
  it('creates an expense with server-set recordedBy (never client-supplied)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);

    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...baseExpense(), recordedBy: '64b000000000000000000000' });

    expect(res.status).toBe(201);
    expect(res.body.data.recordedBy).not.toBe('64b000000000000000000000');
    expect(res.body.data.title).toBe('Monthly Rent');
  });

  it('rejects a non-positive amount', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const res = await request(app).post('/api/expenses').set('Authorization', `Bearer ${token}`).send(baseExpense({ amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('deletes an expense, and deleting again returns 404', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const created = await request(app).post('/api/expenses').set('Authorization', `Bearer ${token}`).send(baseExpense());

    const del = await request(app).delete(`/api/expenses/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(await Expense.findById(created.body.data.id)).toBeNull();

    const delAgain = await request(app).delete(`/api/expenses/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(delAgain.status).toBe(404);
  });

  it('filters by category and date range, and paginates', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    await request(app).post('/api/expenses').set('Authorization', `Bearer ${token}`).send(baseExpense({ category: 'Rent' }));
    await request(app).post('/api/expenses').set('Authorization', `Bearer ${token}`).send(baseExpense({ category: 'Salaries', title: 'Payroll' }));

    const res = await request(app).get('/api/expenses?category=Rent').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].category).toBe('Rent');
  });
});

describe('Authorization / RBAC', () => {
  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  it('rejects an Inventory Specialist (lacks create_sale)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, {
      role: 'Inventory Specialist',
      permissions: ['view_inventory', 'adjust_inventory', 'manage_medicines', 'manage_purchases']
    });
    const res = await request(app).post('/api/expenses').set('Authorization', `Bearer ${token}`).send(baseExpense());
    expect(res.status).toBe(403);
  });
});
