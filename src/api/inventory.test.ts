import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getExpiryRadar } from './inventory';
import { setAccessToken } from './client';

function jsonResponse(body: unknown): Response {
  return { status: 200, ok: true, json: async () => body } as Response;
}

const RAW_RADAR_ITEM = {
  medicineId: 'm1',
  medicineName: 'Paracetamol',
  genericName: 'Paracetamol',
  category: 'Analgesics',
  batchId: 'b1',
  batchNumber: 'PCM-1',
  quantity: 50,
  expiryDate: '2026-09-15T18:30:00.000Z',
  purchasePrice: 12,
  mrp: 25,
  lossExposure: 600,
  daysRemaining: 13
};

describe('src/api/inventory expiry radar', () => {
  beforeEach(() => setAccessToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('truncates expiryDate to YYYY-MM-DD', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ success: true, data: [RAW_RADAR_ITEM], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } })
      )
    );

    const { items } = await getExpiryRadar('all', 1, 50);

    expect(items[0].expiryDate).toBe('2026-09-15');
    expect(items[0].daysRemaining).toBe(13);
  });
});
