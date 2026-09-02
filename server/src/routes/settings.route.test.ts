import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDB, connectTestDB, disconnectTestDB } from '../test/setupMemoryDb';
import { authedUser } from '../test/authHelpers';
import { createApp } from '../app';

beforeAll(connectTestDB, 60000);
afterEach(clearTestDB);
afterAll(disconnectTestDB, 30000);

describe('Settings singleton', () => {
  it('auto-provisions the singleton with the documented defaults on first read', async () => {
    const app = createApp();
    const { token } = await authedUser(app);

    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.store.name).toBe('Apex Care Pharmacy & Surgical Hub');
    expect(res.body.data.pos.defaultTaxRate).toBe(12);
    expect(res.body.data.inventory.lowStockThreshold).toBe(20);
  });

  it('partially updates only the submitted sub-object fields, leaving the rest untouched', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    await request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);

    const updated = await request(app)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ pos: { defaultTaxRate: 18 } });

    expect(updated.status).toBe(200);
    expect(updated.body.data.pos.defaultTaxRate).toBe(18);
    // Untouched pos fields survive the partial update.
    expect(updated.body.data.pos.roundOffTotal).toBe(true);
    expect(updated.body.data.store.name).toBe('Apex Care Pharmacy & Surgical Hub');
  });

  it('persists updates across a fresh read (reload persistence)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    await request(app).patch('/api/settings').set('Authorization', `Bearer ${token}`).send({ store: { name: 'Riverside Pharmacy' } });

    const reread = await request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);
    expect(reread.body.data.store.name).toBe('Riverside Pharmacy');
  });

  it('rejects an invalid value (e.g. tax rate over 100)', async () => {
    const app = createApp();
    const { token } = await authedUser(app);
    const res = await request(app).patch('/api/settings').set('Authorization', `Bearer ${token}`).send({ pos: { defaultTaxRate: 150 } });
    expect(res.status).toBe(400);
  });
});

describe('Authorization / RBAC', () => {
  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });

  it('rejects a Cashier (lacks manage_settings)', async () => {
    const app = createApp();
    const { token } = await authedUser(app, { role: 'Cashier', permissions: ['view_pos', 'create_sale'] });
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
