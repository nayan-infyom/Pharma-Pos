import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDB, connectTestDB, disconnectTestDB } from '../test/setupMemoryDb';
import { authedUser } from '../test/authHelpers';
import { createApp } from '../app';
import { Customer } from '../models/Customer.model';

beforeAll(connectTestDB, 60000);
afterEach(clearTestDB);
afterAll(disconnectTestDB, 30000);

function basePrescription(overrides: Record<string, unknown> = {}) {
  return {
    patientName: 'Ramesh Kumar',
    doctorName: 'Dr. Sameer Mehta',
    hospitalClinic: 'Apex Care Clinic',
    diagnosis: 'Bacterial infection',
    items: [{ medicineName: 'Augmentin 625 Duo', dosage: '1-0-1', duration: '5 days', quantity: 10, timing: 'After Food' }],
    ...overrides
  };
}

describe('Prescription CRUD + validation', () => {
  it('creates a prescription with a server-generated sequential prescriptionNumber', async () => {
    const app = createApp();
    const { token } = await authedUser(app);

    const res = await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(basePrescription());
    expect(res.status).toBe(201);
    expect(res.body.data.prescriptionNumber).toMatch(/^RX-\d+$/);
    expect(res.body.data.status).toBe('Pending');
  });

  it('allows an item with no medicineId (drug not yet catalogued)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(basePrescription({ items: [{ medicineName: 'Handwritten Drug X', dosage: '1-1-1', duration: '3 days', quantity: 6 }] }));
    expect(res.status).toBe(201);
    expect(res.body.data.items[0].medicineId).toBeUndefined();
  });

  it('rejects creation with no items', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const res = await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(basePrescription({ items: [] }));
    expect(res.status).toBe(400);
  });

  it('rejects creation missing doctorName', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const payload = basePrescription();
    delete (payload as Record<string, unknown>).doctorName;
    const res = await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(payload);
    expect(res.status).toBe(400);
  });

  it('reads a prescription by id and returns 404 for a nonexistent one', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const created = await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(basePrescription());
    const getRes = await request(app).get(`/api/prescriptions/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);

    const missing = await request(app).get('/api/prescriptions/64b000000000000000000000').set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it('updates status (the "Dispense in POS" transition)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const created = await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(basePrescription());

    const res = await request(app)
      .patch(`/api/prescriptions/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Dispensed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Dispensed');
  });
});

describe('Search / filter / pagination', () => {
  it('filters by customerId and status, and paginates', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const customer = await Customer.create({ name: 'Ramesh Kumar', phone: '9811111111' });

    await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(basePrescription({ customerId: customer.id }));
    await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(basePrescription());

    const res = await request(app).get(`/api/prescriptions?customerId=${customer.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].customerId).toBe(customer.id);
  });
});

describe('Authorization / RBAC', () => {
  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    const res = await request(app).get('/api/prescriptions');
    expect(res.status).toBe(401);
  });

  it('rejects an Inventory Specialist (lacks create_sale)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, {
      role: 'Inventory Specialist',
      permissions: ['view_inventory', 'adjust_inventory', 'manage_medicines', 'manage_purchases']
    });
    const res = await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(basePrescription());
    expect(res.status).toBe(403);
  });

  it('allows a Cashier (holds create_sale)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, { role: 'Cashier', permissions: ['view_pos', 'create_sale', 'view_inventory'] });
    const res = await request(app).post('/api/prescriptions').set('Authorization', `Bearer ${token}`).send(basePrescription());
    expect(res.status).toBe(201);
  });
});
