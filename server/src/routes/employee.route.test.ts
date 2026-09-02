import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDB, connectTestDB, disconnectTestDB } from '../test/setupMemoryDb';
import { authedUser } from '../test/authHelpers';
import { createApp } from '../app';

beforeAll(connectTestDB, 60000);
afterEach(clearTestDB);
afterAll(disconnectTestDB, 30000);

function baseEmployee(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Priya Sharma',
    email: `priya-${Date.now()}@apexpharma.com`,
    phone: '9811122233',
    role: 'Staff Pharmacist',
    permissions: ['view_pos', 'create_sale'],
    ...overrides
  };
}

describe('Employee CRUD + validation', () => {
  it('creates an employee with the submitted role/permissions', async () => {
    const app = createApp();
    const { token } = await authedUser(app);

    const res = await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send(baseEmployee());

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('Staff Pharmacist');
    expect(res.body.data.permissions).toEqual(['view_pos', 'create_sale']);
    expect(res.body.data.status).toBe('Active');
  });

  it('rejects an invalid permission value', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(baseEmployee({ permissions: ['not_a_real_permission'] }));
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const email = `dup-${Date.now()}@apexpharma.com`;
    await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send(baseEmployee({ email }));
    const res = await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send(baseEmployee({ email }));
    expect(res.status).toBe(409);
  });

  it('updates status and permissions, and reads back the change', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const created = await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send(baseEmployee());

    const updated = await request(app)
      .patch(`/api/employees/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'On Leave', permissions: ['view_pos'] });

    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('On Leave');
    expect(updated.body.data.permissions).toEqual(['view_pos']);

    const fetched = await request(app).get(`/api/employees/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(fetched.body.data.status).toBe('On Leave');
  });

  it('search / pagination works and never returns a passwordHash field', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send(baseEmployee({ name: 'Rohan Verma' }));
    await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send(baseEmployee({ name: 'Kavita Joshi' }));

    const res = await request(app).get('/api/employees?search=Rohan').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((e: { name: string }) => e.name === 'Rohan Verma')).toBe(true);
    expect(res.body.data[0].passwordHash).toBeUndefined();
    expect(res.body.pagination).toBeDefined();
  });
});

describe('Authorization / RBAC', () => {
  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });

  it('rejects a Cashier (lacks manage_employees)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, { role: 'Cashier', permissions: ['view_pos', 'create_sale'] });
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows an Admin (holds manage_employees)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, { role: 'Admin', permissions: ['manage_employees'] });
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
